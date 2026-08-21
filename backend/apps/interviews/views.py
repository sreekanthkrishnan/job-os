from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Interview, InterviewResult
from .serializers import InterviewSerializer
from apps.jobs.models import Job

class JobInterviewListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "message": "Job not found"
            }, status=status.HTTP_404_NOT_FOUND)

        interviews = job.interviews.all()
        serializer = InterviewSerializer(interviews, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })

    def post(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id, user=request.user)
        except Job.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "message": "Job not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = InterviewSerializer(data=request.data, context={'job': job})
        if serializer.is_valid():
            interview = serializer.save()
            return Response({
                "success": True,
                "data": InterviewSerializer(interview).data,
                "message": "Interview round scheduled successfully"
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "data": None,
            "message": "Invalid interview payload",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class InterviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterviewSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Interview.objects.filter(job__user=self.request.user)

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
            interview = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(interview).data,
                "message": "Interview round updated successfully"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Interview update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Interview round deleted"
        }, status=status.HTTP_200_OK)


class UpcomingInterviewsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        upcoming = Interview.objects.filter(
            job__user=request.user,
            result__in=[InterviewResult.SCHEDULED, InterviewResult.RESCHEDULED]
        ).select_related('job').order_by('scheduled_at')

        serializer = InterviewSerializer(upcoming, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": None
        })
