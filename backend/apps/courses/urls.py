from django.urls import path
from .views import (
    CourseListCreateView,
    CourseDetailView,
    CourseNoteListCreateView,
    CourseNoteDetailView,
    LearningRoadmapListCreateView,
    LearningRoadmapDetailView,
    GenerateRoadmapAPIView,
    GenerateSkillGapRoadmapAPIView,
    DiscoverTopicResourcesAPIView,
    AddResourceToTopicAPIView,
    UpdateTopicProgressAPIView,
    UpdateResourceProgressAPIView,
    NextTopicRecommendationAPIView,
    AdaptTopicAPIView,
    RoadmapDashboardStatsAPIView
)

urlpatterns = [
    # Existing Courses & Notes API
    path('', CourseListCreateView.as_view(), name='course_list_create'),
    path('<uuid:id>/', CourseDetailView.as_view(), name='course_detail'),
    path('<uuid:course_id>/notes/', CourseNoteListCreateView.as_view(), name='course_note_list_create'),
    path('notes/<uuid:id>/', CourseNoteDetailView.as_view(), name='course_note_detail'),

    # AI Learning Roadmaps & Discovery API
    path('roadmaps/', LearningRoadmapListCreateView.as_view(), name='roadmap_list_create'),
    path('roadmaps/generate/', GenerateRoadmapAPIView.as_view(), name='roadmap_generate'),
    path('roadmaps/generate-from-skill-gap/', GenerateSkillGapRoadmapAPIView.as_view(), name='roadmap_generate_skill_gap'),
    path('roadmaps/discover/', DiscoverTopicResourcesAPIView.as_view(), name='roadmap_discover_global'),
    path('roadmaps/dashboard-stats/', RoadmapDashboardStatsAPIView.as_view(), name='roadmap_dashboard_stats'),
    path('roadmaps/<uuid:id>/', LearningRoadmapDetailView.as_view(), name='roadmap_detail'),
    path('roadmaps/<uuid:id>/next-topic/', NextTopicRecommendationAPIView.as_view(), name='roadmap_next_topic'),
    path('roadmaps/topics/<uuid:topic_id>/discover/', DiscoverTopicResourcesAPIView.as_view(), name='roadmap_topic_discover'),
    path('roadmaps/topics/<uuid:topic_id>/resources/', AddResourceToTopicAPIView.as_view(), name='roadmap_topic_add_resource'),
    path('roadmaps/topics/<uuid:topic_id>/progress/', UpdateTopicProgressAPIView.as_view(), name='roadmap_topic_progress'),
    path('roadmaps/topics/<uuid:topic_id>/adapt/', AdaptTopicAPIView.as_view(), name='roadmap_topic_adapt'),
    path('roadmaps/resources/<uuid:resource_id>/', UpdateResourceProgressAPIView.as_view(), name='roadmap_resource_update'),
]
