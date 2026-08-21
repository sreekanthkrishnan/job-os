from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import (
    Course, CourseNote, CourseStatus,
    LearningRoadmap, RoadmapModule, RoadmapTopic, LearningResource,
    RoadmapStatus, TopicStatus, TopicDifficulty, ResourceType
)
from .serializers import (
    CourseSerializer, CourseNoteSerializer,
    LearningRoadmapSerializer, RoadmapModuleSerializer, RoadmapTopicSerializer,
    LearningResourceSerializer, CreateRoadmapPayloadSerializer,
    DiscoverResourcesPayloadSerializer
)
from .services import (
    generate_learning_roadmap, discover_and_rank_resources,
    recommend_next_topic, generate_learning_insights
)
from apps.skills.models import Skill, SkillProficiency, SkillSource, SkillCategory
from apps.skills.normalizer import normalize_skill_name, infer_skill_category
from apps.career.models import TargetRole, CareerProfile
from apps.jobs.models import Job


class CourseListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.filter(user=self.request.user).prefetch_related('course_skills', 'notes')
        params = self.request.query_params

        status_param = params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        search = params.get('search') or params.get('q')
        if search:
            search_str = search.strip()
            queryset = queryset.filter(
                Q(name__icontains=search_str) |
                Q(description__icontains=search_str) |
                Q(provider__icontains=search_str) |
                Q(course_skills__skill_name__icontains=search_str)
            ).distinct()

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            course = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(course).data,
                "message": "Course created successfully"
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "message": "Invalid course payload",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Course.objects.filter(user=self.request.user).prefetch_related('course_skills', 'notes')

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
            course = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(course).data,
                "message": "Course updated successfully"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Course update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Course deleted"
        }, status=status.HTTP_200_OK)


class CourseNoteListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, user=request.user)
        except Course.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "message": "Course not found"
            }, status=status.HTTP_404_NOT_FOUND)

        notes = course.notes.all()
        serializer = CourseNoteSerializer(notes, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })

    def post(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, user=request.user)
        except Course.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "message": "Course not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = CourseNoteSerializer(data=request.data)
        if serializer.is_valid():
            note = serializer.save(course=course)
            return Response({
                "success": True,
                "data": CourseNoteSerializer(note).data,
                "message": "Note created"
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "message": "Invalid note payload",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class CourseNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseNoteSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return CourseNote.objects.filter(course__user=self.request.user)

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
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            note = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(note).data,
                "message": "Note updated"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Note update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Note deleted"
        }, status=status.HTTP_200_OK)


# ==========================================
# AI LEARNING ROADMAP & COURSE DISCOVERY VIEWS
# ==========================================

def _persist_generated_roadmap(user, roadmap_json: dict, goal: str, reason: str, current_level: str, target_level: str, weekly_hours: int, target_role: str, source_job=None) -> LearningRoadmap:
    """Helper to save Gemini generated roadmap JSON into LearningRoadmap, Modules, and Topics models."""
    roadmap = LearningRoadmap.objects.create(
        user=user,
        title=roadmap_json.get('title', f"{goal} Roadmap"),
        description=roadmap_json.get('description', ''),
        goal=goal,
        reason=reason,
        current_level=current_level,
        target_level=target_level,
        target_role=target_role,
        estimated_duration_weeks=roadmap_json.get('estimated_duration_weeks', 4),
        weekly_hours=weekly_hours,
        source_job=source_job
    )

    modules_data = roadmap_json.get('modules', [])
    topic_order_counter = 1

    for m_idx, mod_dict in enumerate(modules_data, start=1):
        module = RoadmapModule.objects.create(
            roadmap=roadmap,
            title=mod_dict.get('title', f"Phase {m_idx}"),
            description=mod_dict.get('description', ''),
            order=mod_dict.get('order', m_idx)
        )

        topics_data = mod_dict.get('topics', [])
        for top_dict in topics_data:
            diff_raw = str(top_dict.get('difficulty', 'intermediate')).lower()
            diff_choice = TopicDifficulty.INTERMEDIATE
            if 'begin' in diff_raw:
                diff_choice = TopicDifficulty.BEGINNER
            elif 'adv' in diff_raw:
                diff_choice = TopicDifficulty.ADVANCED

            RoadmapTopic.objects.create(
                roadmap=roadmap,
                module=module,
                title=top_dict.get('title', 'Learning Topic'),
                description=top_dict.get('description', ''),
                order=topic_order_counter,
                difficulty=diff_choice,
                estimated_hours=top_dict.get('estimated_hours', 4),
                prerequisites=top_dict.get('prerequisites', []),
                learning_objectives=top_dict.get('learning_objectives', []),
                target_skills=top_dict.get('target_skills', [])
            )
            topic_order_counter += 1

    roadmap.recalculate_progress()
    return roadmap


class LearningRoadmapListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LearningRoadmapSerializer

    def get_queryset(self):
        queryset = LearningRoadmap.objects.filter(user=self.request.user).prefetch_related(
            'modules__topics__resources', 'topics__resources'
        )
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            search_str = search.strip()
            queryset = queryset.filter(
                Q(title__icontains=search_str) |
                Q(goal__icontains=search_str) |
                Q(target_role__icontains=search_str)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })


class LearningRoadmapDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LearningRoadmapSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return LearningRoadmap.objects.filter(user=self.request.user).prefetch_related(
            'modules__topics__resources', 'topics__resources'
        )

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
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            roadmap = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(roadmap).data,
                "message": "Roadmap updated"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Roadmap update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Roadmap deleted"
        }, status=status.HTTP_200_OK)


class GenerateRoadmapAPIView(APIView):
    """
    Endpoint: POST /api/courses/roadmaps/generate/
    Generates structured AI learning roadmap using Google Gemini considering existing user skills & gaps.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateRoadmapPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "data": None,
                "message": "Invalid input",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = request.user

        # Fetch user context
        user_skills = list(Skill.objects.filter(user=user).values('name', 'category', 'proficiency'))
        primary_target = TargetRole.objects.filter(user=user, is_primary=True).first()
        target_role = data.get('target_role') or (primary_target.name if primary_target else "")

        # Compute missing skills from user jobs
        user_skill_names = set(Skill.objects.filter(user=user).values_list('name', flat=True))
        user_jobs = Job.objects.filter(user=user).prefetch_related('job_skills')
        missing_skills_set = set()
        for j in user_jobs:
            j_skills = set(j.job_skills.values_list('skill_name', flat=True))
            missing_skills_set.update(j_skills - user_skill_names)

        roadmap_json = generate_learning_roadmap(
            goal=data['goal'],
            reason=data['reason'],
            current_level=data['current_level'],
            target_level=data['target_level'],
            weekly_hours=data['weekly_hours'],
            target_role=target_role,
            user_skills=user_skills,
            missing_skills=list(missing_skills_set)
        )

        roadmap = _persist_generated_roadmap(
            user=user,
            roadmap_json=roadmap_json,
            goal=data['goal'],
            reason=data['reason'],
            current_level=data['current_level'],
            target_level=data['target_level'],
            weekly_hours=data['weekly_hours'],
            target_role=target_role
        )

        return Response({
            "success": True,
            "data": LearningRoadmapSerializer(roadmap).data,
            "message": "Learning roadmap generated successfully"
        }, status=status.HTTP_201_CREATED)


class GenerateSkillGapRoadmapAPIView(APIView):
    """
    Endpoint: POST /api/courses/roadmaps/generate-from-skill-gap/
    Automatically builds a roadmap from user's aggregate missing skill gaps.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user_skills = list(Skill.objects.filter(user=user).values('name', 'category', 'proficiency'))
        primary_target = TargetRole.objects.filter(user=user, is_primary=True).first()
        target_role = primary_target.name if primary_target else "Software Engineer"

        # Calculate top missing skills across active job applications
        user_skill_names = set(Skill.objects.filter(user=user).values_list('name', flat=True))
        user_jobs = Job.objects.filter(user=user).prefetch_related('job_skills')
        skill_counts = {}
        for j in user_jobs:
            j_skills = set(j.job_skills.values_list('skill_name', flat=True))
            for s in (j_skills - user_skill_names):
                skill_counts[s] = skill_counts.get(s, 0) + 1

        sorted_gaps = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
        top_gaps = [g[0] for g in sorted_gaps[:6]]

        goal = f"{target_role} Skill Gap Masterclass" if top_gaps else "Technical Skill Gap Mastery"

        roadmap_json = generate_learning_roadmap(
            goal=goal,
            reason="Skill Gap Elimination",
            current_level="intermediate",
            target_level="advanced",
            weekly_hours=7,
            target_role=target_role,
            user_skills=user_skills,
            missing_skills=top_gaps
        )

        roadmap = _persist_generated_roadmap(
            user=user,
            roadmap_json=roadmap_json,
            goal=goal,
            reason="Skill Gap Elimination",
            current_level="intermediate",
            target_level="advanced",
            weekly_hours=7,
            target_role=target_role
        )

        return Response({
            "success": True,
            "data": LearningRoadmapSerializer(roadmap).data,
            "message": "Skill gap learning roadmap generated"
        }, status=status.HTTP_201_CREATED)


class JobLearningRoadmapAPIView(APIView):
    """
    Endpoint: POST /api/jobs/{id}/learning-roadmap/
    Creates a customized preparation roadmap from a specific job's missing skills.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        job = get_object_or_404(Job, id=id, user=request.user)
        user_skills_qs = Skill.objects.filter(user=request.user)
        user_skills_list = list(user_skills_qs.values('name', 'category', 'proficiency'))
        user_skill_names = set(user_skills_qs.values_list('name', flat=True))

        job_skill_names = set(job.job_skills.values_list('skill_name', flat=True))
        missing_skills = list(job_skill_names - user_skill_names) if job_skill_names else []

        goal = f"{job.role} @ {job.company} Preparation Roadmap"

        context_job = {
            "role": job.role,
            "company": job.company
        }

        roadmap_json = generate_learning_roadmap(
            goal=goal,
            reason=f"Interview & Role Prep for {job.company}",
            current_level="intermediate",
            target_level="advanced",
            weekly_hours=8,
            target_role=job.role,
            user_skills=user_skills_list,
            missing_skills=missing_skills,
            context_job=context_job
        )

        roadmap = _persist_generated_roadmap(
            user=request.user,
            roadmap_json=roadmap_json,
            goal=goal,
            reason=f"Job Prep: {job.role} @ {job.company}",
            current_level="intermediate",
            target_level="advanced",
            weekly_hours=8,
            target_role=job.role,
            source_job=job
        )

        return Response({
            "success": True,
            "data": LearningRoadmapSerializer(roadmap).data,
            "message": f"Learning roadmap created for {job.role}"
        }, status=status.HTTP_201_CREATED)


class DiscoverTopicResourcesAPIView(APIView):
    """
    Endpoint: POST /api/courses/roadmaps/topics/{topic_id}/discover/
    and POST /api/courses/roadmaps/discover/
    Discovers real, verified web courses & documentation resources using search retrieval + Gemini ranking.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, topic_id=None):
        topic = None
        if topic_id:
            topic = get_object_or_404(RoadmapTopic, id=topic_id, roadmap__user=request.user)

        serializer = DiscoverResourcesPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            topic_title = topic.title if topic else request.data.get('topic_title', 'Software Engineering')
            topic_desc = topic.description if topic else ''
            target_skills = topic.target_skills if topic else []
            user_level = topic.difficulty if topic else 'intermediate'
        else:
            data = serializer.validated_data
            topic_title = data['topic_title'] or (topic.title if topic else 'Software Engineering')
            topic_desc = data.get('topic_description') or (topic.description if topic else '')
            target_skills = data.get('target_skills') or (topic.target_skills if topic else [])
            user_level = data.get('user_level') or (topic.difficulty if topic else 'intermediate')

        resources = discover_and_rank_resources(
            topic_title=topic_title,
            topic_description=topic_desc,
            target_skills=target_skills,
            user_level=user_level
        )

        return Response({
            "success": True,
            "data": {
                "topic_id": str(topic.id) if topic else None,
                "topic_title": topic_title,
                "resources": resources
            },
            "message": None
        })


class AddResourceToTopicAPIView(APIView):
    """
    Endpoint: POST /api/courses/roadmaps/topics/{topic_id}/resources/
    Saves a discovered resource to a topic. Optionally creates a Course in My Courses.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, topic_id):
        topic = get_object_or_404(RoadmapTopic, id=topic_id, roadmap__user=request.user)
        user = request.user

        title = request.data.get('title')
        url = request.data.get('url')
        if not title or not url:
            return Response({
                "success": False,
                "data": None,
                "message": "Title and URL are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        provider = request.data.get('provider', '')
        resource_type = request.data.get('resource_type', 'course')
        difficulty = request.data.get('difficulty', topic.difficulty)
        duration = request.data.get('duration', '')
        is_free = request.data.get('is_free', True)
        why_recommended = request.data.get('why_recommended', '')
        add_to_my_courses = request.data.get('add_to_my_courses', True)

        course_obj = None
        if add_to_my_courses:
            course_obj = Course.objects.create(
                user=user,
                name=title,
                description=f"Roadmap Resource for '{topic.title}'. {why_recommended}",
                provider=provider,
                course_url=url,
                progress=0,
                status=CourseStatus.PLANNED
            )

        resource = LearningResource.objects.create(
            user=user,
            topic=topic,
            course=course_obj,
            title=title,
            provider=provider,
            url=url,
            resource_type=resource_type,
            difficulty=difficulty,
            duration=duration,
            is_free=is_free,
            why_recommended=why_recommended,
            added_to_my_courses=add_to_my_courses
        )

        # Update topic status to in_progress if not started
        if topic.status == TopicStatus.NOT_STARTED:
            topic.set_status_and_sync(TopicStatus.IN_PROGRESS)

        return Response({
            "success": True,
            "data": LearningResourceSerializer(resource).data,
            "message": "Resource added to roadmap topic"
        }, status=status.HTTP_201_CREATED)


class UpdateTopicProgressAPIView(APIView):
    """
    Endpoint: PATCH /api/courses/roadmaps/topics/{topic_id}/progress/
    Updates progress and status of a roadmap topic, syncs roadmap progress, and records skill learning evidence.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, topic_id):
        topic = get_object_or_404(RoadmapTopic, id=topic_id, roadmap__user=request.user)

        new_status = request.data.get('status')
        new_progress = request.data.get('progress')

        if new_progress is not None:
            try:
                new_progress = int(new_progress)
            except ValueError:
                pass

        if new_status and new_status in TopicStatus.values:
            topic.set_status_and_sync(new_status, new_progress)
        elif new_progress is not None:
            calc_status = topic.status
            if new_progress >= 100:
                calc_status = TopicStatus.COMPLETED
            elif new_progress > 0:
                calc_status = TopicStatus.IN_PROGRESS
            topic.set_status_and_sync(calc_status, new_progress)

        # If completed, add skills to user's profile as learning evidence
        if topic.status == TopicStatus.COMPLETED or topic.progress >= 100:
            for skill_raw in topic.target_skills:
                norm_name = normalize_skill_name(skill_raw)
                if norm_name:
                    cat = infer_skill_category(norm_name)
                    Skill.objects.get_or_create(
                        user=request.user,
                        name=norm_name,
                        defaults={
                            "category": cat,
                            "proficiency": SkillProficiency.INTERMEDIATE,
                            "source": SkillSource.COURSE
                        }
                    )

        return Response({
            "success": True,
            "data": RoadmapTopicSerializer(topic).data,
            "message": "Topic progress updated"
        })


class UpdateResourceProgressAPIView(APIView):
    """
    Endpoint: PATCH /api/courses/roadmaps/resources/{resource_id}/
    Updates progress/status of a learning resource.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, resource_id):
        resource = get_object_or_404(LearningResource, id=resource_id, user=request.user)

        new_status = request.data.get('status')
        new_progress = request.data.get('progress')

        if new_status and new_status in TopicStatus.values:
            resource.status = new_status
        if new_progress is not None:
            try:
                prog = int(new_progress)
                resource.progress = min(100, max(0, prog))
                if resource.progress >= 100:
                    resource.status = TopicStatus.COMPLETED
            except ValueError:
                pass

        resource.save()

        # Sync linked Course if exists
        if resource.course:
            resource.course.progress = resource.progress
            if resource.status == TopicStatus.COMPLETED:
                resource.course.status = CourseStatus.COMPLETED
            elif resource.status == TopicStatus.IN_PROGRESS:
                resource.course.status = CourseStatus.IN_PROGRESS
            resource.course.save()

        return Response({
            "success": True,
            "data": LearningResourceSerializer(resource).data,
            "message": "Resource updated"
        })


class NextTopicRecommendationAPIView(APIView):
    """
    Endpoint: POST /api/courses/roadmaps/{id}/next-topic/
    Returns AI "What should I learn next?" guidance for a roadmap.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        roadmap = get_object_or_404(LearningRoadmap, id=id, user=request.user)
        topics = list(roadmap.topics.values('id', 'title', 'status', 'estimated_hours', 'prerequisites'))

        rec = recommend_next_topic(
            roadmap_title=roadmap.title,
            topics=topics,
            target_role=roadmap.target_role or ''
        )

        return Response({
            "success": True,
            "data": rec,
            "message": None
        })


class AdaptTopicAPIView(APIView):
    """
    Endpoint: POST /api/courses/roadmaps/topics/{topic_id}/adapt/
    Adapts topic: action_type="skip" or "need_help".
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, topic_id):
        topic = get_object_or_404(RoadmapTopic, id=topic_id, roadmap__user=request.user)
        action_type = request.data.get('action_type', 'skip')

        if action_type == 'skip':
            topic.set_status_and_sync(TopicStatus.SKIPPED, 100)
            return Response({
                "success": True,
                "data": RoadmapTopicSerializer(topic).data,
                "message": f"Topic '{topic.title}' marked as Already Familiar and skipped."
            })

        # Need help -> discover prerequisite resources
        discovered = discover_and_rank_resources(
            topic_title=f"{topic.title} fundamentals prerequisites tutorial",
            topic_description=topic.description,
            target_skills=topic.target_skills,
            user_level="beginner"
        )

        return Response({
            "success": True,
            "data": {
                "topic": RoadmapTopicSerializer(topic).data,
                "prerequisite_resources": discovered
            },
            "message": "Retrieved beginner prerequisite resources."
        })


class RoadmapDashboardStatsAPIView(APIView):
    """
    Endpoint: GET /api/courses/roadmaps/dashboard-stats/
    Returns unified courses, active roadmaps, skills in progress, and AI learning insights.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        courses = Course.objects.filter(user=user)
        roadmaps = LearningRoadmap.objects.filter(user=user)
        skills = Skill.objects.filter(user=user)

        active_roadmaps_count = roadmaps.filter(status=RoadmapStatus.ACTIVE).count()
        courses_in_progress_count = courses.filter(status=CourseStatus.IN_PROGRESS).count()
        skills_in_progress_count = skills.filter(source=SkillSource.COURSE).count() or skills.count()
        completed_courses_count = courses.filter(status=CourseStatus.COMPLETED).count()

        active_roadmap = roadmaps.filter(status=RoadmapStatus.ACTIVE).first()
        active_roadmap_data = LearningRoadmapSerializer(active_roadmap).data if active_roadmap else None

        # Fetch missing skills across jobs
        user_skill_names = set(skills.values_list('name', flat=True))
        user_jobs = Job.objects.filter(user=user).prefetch_related('job_skills')
        missing_skills_set = set()
        for j in user_jobs:
            j_skills = set(j.job_skills.values_list('skill_name', flat=True))
            missing_skills_set.update(j_skills - user_skill_names)
        missing_skills_list = list(missing_skills_set)

        user_skills_list = list(skills.values_list('name', flat=True))
        active_roadmaps_list = list(roadmaps.filter(status=RoadmapStatus.ACTIVE).values('title'))

        ai_insights = generate_learning_insights(
            user_skills=user_skills_list,
            active_roadmaps=active_roadmaps_list,
            missing_skills=missing_skills_list
        )

        return Response({
            "success": True,
            "data": {
                "total_courses": courses.count(),
                "active_roadmaps_count": active_roadmaps_count,
                "courses_in_progress": courses_in_progress_count,
                "skills_in_progress": skills_in_progress_count,
                "completed_courses": completed_courses_count,
                "active_roadmap": active_roadmap_data,
                "ai_insights": ai_insights
            },
            "message": None
        })
