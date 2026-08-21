from django.urls import path
from .views import (
    SkillListCreateView,
    SkillDetailView,
    SkillNormalizeView,
    SkillStatsView
)

urlpatterns = [
    path('', SkillListCreateView.as_view(), name='skill_list_create'),
    path('stats/', SkillStatsView.as_view(), name='skill_stats'),
    path('normalize/', SkillNormalizeView.as_view(), name='skill_normalize'),
    path('<uuid:id>/', SkillDetailView.as_view(), name='skill_detail'),
]
