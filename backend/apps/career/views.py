from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CareerProfile, TargetRole
from .serializers import CareerProfileSerializer, TargetRoleSerializer

class CareerProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, created = CareerProfile.objects.get_or_create(user=request.user)
        serializer = CareerProfileSerializer(profile)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })

    def patch(self, request):
        profile, created = CareerProfile.objects.get_or_create(user=request.user)
        serializer = CareerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "message": "Career profile updated successfully"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Failed to update profile",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class TargetRoleListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TargetRoleSerializer

    def get_queryset(self):
        return TargetRole.objects.filter(user=self.request.user)

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
            target_role = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(target_role).data,
                "message": "Target role added successfully"
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "message": "Failed to add target role",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class TargetRoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TargetRoleSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return TargetRole.objects.filter(user=self.request.user)

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
            target_role = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(target_role).data,
                "message": "Target role updated successfully"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Failed to update target role",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Target role removed"
        }, status=status.HTTP_200_OK)
