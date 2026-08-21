from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, UserMeView

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='auth_signup'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('me/', UserMeView.as_view(), name='auth_me'),
]
