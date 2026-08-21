from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import get_user_analytics_overview

class AnalyticsOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_user_analytics_overview(request.user)
        return Response({
            "success": True,
            "data": data,
            "message": None
        }, status=status.HTTP_200_OK)
