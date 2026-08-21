from django.urls import path
from .views import CareerProfileView, TargetRoleListCreateView, TargetRoleDetailView

urlpatterns = [
    path('profile/', CareerProfileView.as_view(), name='career_profile'),
    path('target-roles/', TargetRoleListCreateView.as_view(), name='target_role_list_create'),
    path('target-roles/<uuid:id>/', TargetRoleDetailView.as_view(), name='target_role_detail'),
]
