import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.resumes.models import (
    Resume, ResumeVersion, ResumeSkill,
    ResumeJobAnalysis, ResumeOptimization, OutreachMessage,
    ResumeParseStatus
)
from apps.resumes.serializers import (
    ResumeSerializer, ResumeCreateSerializer, ResumeVersionSerializer,
    ResumeJobAnalysisSerializer, ResumeOptimizationSerializer, OutreachMessageSerializer
)
from apps.resumes.parser import parse_resume_document
from apps.resumes.analyzer import analyze_resume_text
from apps.resumes.matcher import analyze_resumes_for_job
from apps.resumes.optimizer import optimize_resume_for_job
from apps.resumes.outreach import generate_outreach_content
from apps.jobs.models import Job

logger = logging.getLogger(__name__)

class ResumeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = ResumeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload_file = request.FILES.get('file')
        if not upload_file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        # File validation
        file_bytes = upload_file.read()
        file_size = len(file_bytes)
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            return Response({"error": "File size exceeds 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        filename = upload_file.name
        try:
            raw_text, file_type = parse_resume_document(file_bytes, filename)
        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to extract document text: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Re-seek file for field saving
        upload_file.seek(0)

        with transaction.atomic():
            resume = serializer.save(
                user=request.user,
                file_type=file_type,
                file_size=file_size,
                raw_text=raw_text,
                parsed_status=ResumeParseStatus.COMPLETED
            )

            # Analyze resume with Gemini AI
            parsed_profile = analyze_resume_text(raw_text)
            resume.parsed_data = parsed_profile
            resume.analysis_status = ResumeParseStatus.COMPLETED
            resume.save()

            # Create ResumeSkills
            skills = parsed_profile.get("skills", [])
            categories = parsed_profile.get("skill_categories", {})
            for sk_name in skills:
                cat = "other"
                if isinstance(categories, dict):
                    for c_name, c_list in categories.items():
                        if isinstance(c_list, list) and sk_name in c_list:
                            cat = c_name
                            break
                ResumeSkill.objects.create(
                    resume=resume,
                    name=sk_name,
                    category=cat
                )

            # Create initial version
            ResumeVersion.objects.create(
                resume=resume,
                version_number=resume.version,
                notes="Initial Upload",
                raw_text=raw_text,
                parsed_data=parsed_profile
            )

        res_serializer = ResumeSerializer(resume, context={'request': request})
        return Response(res_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """Triggers AI analysis on an existing resume."""
        resume = self.get_object()
        raw_text = resume.raw_text or ""
        parsed_profile = analyze_resume_text(raw_text)
        resume.parsed_data = parsed_profile
        resume.analysis_status = ResumeParseStatus.COMPLETED
        resume.save()

        # Update skills
        resume.resume_skills.all().delete()
        skills = parsed_profile.get("skills", [])
        categories = parsed_profile.get("skill_categories", {})
        for sk_name in skills:
            cat = "other"
            if isinstance(categories, dict):
                for c_name, c_list in categories.items():
                    if isinstance(c_list, list) and sk_name in c_list:
                        cat = c_name
                        break
            ResumeSkill.objects.create(
                resume=resume,
                name=sk_name,
                category=cat
            )

        serializer = self.get_serializer(resume)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def analysis(self, request, pk=None):
        """Returns raw parsed JSON profile of resume."""
        resume = self.get_object()
        return Response(resume.parsed_data or {})

    @action(detail=True, methods=['post'], url_path='create-version')
    def create_version(self, request, pk=None):
        """Creates a new version of a resume after optimization."""
        resume = self.get_object()
        notes = request.data.get('notes', 'Optimized Version')
        new_text = request.data.get('raw_text', resume.raw_text)
        job_id = request.data.get('job_id')

        new_version_num = resume.version + 1
        job_obj = Job.objects.filter(id=job_id, user=request.user).first() if job_id else None

        with transaction.atomic():
            parsed_profile = analyze_resume_text(new_text) if new_text != resume.raw_text else resume.parsed_data
            resume.version = new_version_num
            resume.raw_text = new_text
            resume.parsed_data = parsed_profile
            resume.save()

            ver_obj = ResumeVersion.objects.create(
                resume=resume,
                version_number=new_version_num,
                target_job=job_obj,
                notes=notes,
                raw_text=new_text,
                parsed_data=parsed_profile
            )

        ver_serializer = ResumeVersionSerializer(ver_obj)
        return Response(ver_serializer.data, status=status.HTTP_201_CREATED)


# Standalone Job Resume Intelligence Endpoints

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def analyze_job_resumes_view(request, job_id):
    """Compares all user active resumes against job and returns ranked results."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    analyses = analyze_resumes_for_job(request.user, job)
    serializer = ResumeJobAnalysisSerializer(analyses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_job_resume_analyses_view(request, job_id):
    """Returns stored resume analyses for a job."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    analyses = ResumeJobAnalysis.objects.filter(job=job).order_by('-suitability_score')
    serializer = ResumeJobAnalysisSerializer(analyses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_recommended_resume_view(request, job_id):
    """Returns top recommended resume analysis for a job."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    rec = ResumeJobAnalysis.objects.filter(job=job, is_recommended=True).first()
    if not rec:
        rec = ResumeJobAnalysis.objects.filter(job=job).order_by('-suitability_score').first()
    if not rec:
        # Run analysis if none exists yet
        analyses = analyze_resumes_for_job(request.user, job)
        rec = analyses[0] if analyses else None

    if not rec:
        return Response({"message": "No active resumes found to compare."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ResumeJobAnalysisSerializer(rec)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def optimize_resume_view(request, job_id):
    """Generates resume optimization recommendations for a specific job."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    resume_id = request.data.get('resume_id')
    if resume_id:
        resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    else:
        # Pick top recommended resume
        rec = ResumeJobAnalysis.objects.filter(job=job, is_recommended=True).first()
        if rec:
            resume = rec.resume
        else:
            resume = Resume.objects.filter(user=request.user, is_active=True).first()

    if not resume:
        return Response({"error": "No resume selected or found for optimization."}, status=status.HTTP_400_BAD_REQUEST)

    optimization = optimize_resume_for_job(resume, job)
    serializer = ResumeOptimizationSerializer(optimization)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_outreach_view(request, job_id):
    """Generates personalized cold email or LinkedIn message for a job."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    resume_id = request.data.get('resume_id')
    channel = request.data.get('channel', 'email')
    tone = request.data.get('tone', 'professional')
    recipient_name = request.data.get('recipient_name', '')
    recipient_role = request.data.get('recipient_role', '')
    modifier = request.data.get('modifier', '')

    resume = Resume.objects.filter(id=resume_id, user=request.user).first() if resume_id else None

    outreach = generate_outreach_content(
        user=request.user,
        job=job,
        resume=resume,
        channel=channel,
        tone=tone,
        recipient_name=recipient_name,
        recipient_role=recipient_role,
        modifier=modifier
    )

    serializer = OutreachMessageSerializer(outreach)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_job_outreach_messages_view(request, job_id):
    """Returns stored outreach messages for a job."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    messages = OutreachMessage.objects.filter(job=job).order_by('-created_at')
    serializer = OutreachMessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def select_job_resume_view(request, job_id):
    """Links a specific resume to a job application."""
    job = get_object_or_404(Job, id=job_id, user=request.user)
    resume_id = request.data.get('resume_id')
    if not resume_id:
        job.applied_resume = None
        job.save()
        return Response({"message": "Cleared selected resume for application."})

    resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    job.applied_resume = resume
    job.save()
    return Response({"message": f"Assigned '{resume.name}' to application for {job.role} @ {job.company}."})
