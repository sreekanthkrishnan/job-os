from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Course, CourseNote
from .serializers import CourseSerializer, CourseNoteSerializer

class CourseListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.filter(user=self.request.user).prefetch_related('course_skills', 'notes')
        params = self.request.query_params

        # Status filter
        status_param = params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        # Search filter
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
