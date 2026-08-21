from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Job, JobStatus
from .serializers import JobSerializer, JobStatusUpdateSerializer
from .analyzer import analyze_job_description
from .exporter import generate_jobs_excel_workbook, generate_jobs_csv
from apps.skills.models import Skill
from apps.skills.normalizer import normalize_skill_list

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "success": True,
            "data": data,
            "pagination": {
                "page": self.page.number,
                "pageSize": self.get_page_size(self.request),
                "total": self.page.paginator.count,
                "totalPages": self.page.paginator.num_pages
            },
            "message": None
        })

class JobListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.filter(user=user).prefetch_related('job_skills')

        params = self.request.query_params

        # Filter by status
        status_param = params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        # Filter by role
        role_param = params.get('role')
        if role_param and role_param != 'all':
            queryset = queryset.filter(role__icontains=role_param)

        # Filter by work mode
        work_mode_param = params.get('work_mode')
        if work_mode_param and work_mode_param != 'all':
            queryset = queryset.filter(work_mode=work_mode_param)

        # Filter by min match score
        min_match_score = params.get('min_match_score')
        if min_match_score is not None:
            try:
                score_val = float(min_match_score)
                queryset = queryset.filter(match_score__gte=score_val)
            except ValueError:
                pass

        # Search query
        search = params.get('search') or params.get('q')
        if search:
            search_str = search.strip()
            queryset = queryset.filter(
                Q(company__icontains=search_str) |
                Q(role__icontains=search_str) |
                Q(location__icontains=search_str) |
                Q(job_skills__skill_name__icontains=search_str)
            ).distinct()

        # Ordering
        ordering = params.get('ordering', '-applied_date')
        allowed_orderings = ['applied_date', '-applied_date', 'match_score', '-match_score', 'company', '-company', 'created_at', '-created_at']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-applied_date')

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            job = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(job).data,
                "message": "Job application created successfully"
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "message": "Invalid job application data",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Job.objects.filter(user=self.request.user).prefetch_related('job_skills')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            job = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(job).data,
                "message": "Job application updated successfully"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Job application update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Job application deleted"
        }, status=status.HTTP_200_OK)


class JobStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        try:
            job = Job.objects.get(id=id, user=request.user)
        except Job.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "message": "Job application not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = JobStatusUpdateSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            job = serializer.save()
            return Response({
                "success": True,
                "data": JobSerializer(job, context={'request': request}).data,
                "message": f"Job status updated to '{job.get_status_display()}'"
            })

        return Response({
            "success": False,
            "data": None,
            "message": "Status update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class JobAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        raw_description = request.data.get('raw_description')
        if not raw_description or not raw_description.strip():
            return Response({
                "success": False,
                "data": None,
                "message": "Job description text is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Parse raw description text
        extracted_data = analyze_job_description(raw_description.strip())

        # 2. Get user's current skills
        user_skills = set(Skill.objects.filter(user=request.user).values_list('name', flat=True))

        # 3. Calculate instant match score & skills breakdown
        required_skills = extracted_data.get('required_skills', [])
        norm_required_skills = normalize_skill_list(required_skills)

        matching_skills = [s for s in norm_required_skills if s in user_skills]
        missing_skills = [s for s in norm_required_skills if s not in user_skills]

        match_score = round((len(matching_skills) / len(norm_required_skills) * 100), 1) if norm_required_skills else 100.0

        response_data = {
            **extracted_data,
            "required_skills": norm_required_skills,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "match_score": match_score
        }

        return Response({
            "success": True,
            "data": response_data,
            "message": "Job description analyzed successfully"
        }, status=status.HTTP_200_OK)


class JobExportExcelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return generate_jobs_excel_workbook(request.user)


class JobExportCsvView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return generate_jobs_csv(request.user)
