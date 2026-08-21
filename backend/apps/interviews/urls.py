from django.urls import path
from .views import JobInterviewListCreateView, InterviewDetailView, UpcomingInterviewsView

urlpatterns = [
    path('upcoming/', UpcomingInterviewsView.as_view(), name='interview_upcoming'),
    path('<uuid:id>/', InterviewDetailView.as_view(), name='interview_detail'),
    path('job/<uuid:job_id>/', JobInterviewListCreateView.as_view(), name='job_interview_list_create'),
]
