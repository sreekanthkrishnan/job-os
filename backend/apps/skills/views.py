from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Skill, SkillCategory, SkillProficiency
from .serializers import SkillSerializer, NormalizeSkillSerializer
from .normalizer import normalize_skill_name, infer_skill_category

class SkillListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SkillSerializer

    def get_queryset(self):
        queryset = Skill.objects.filter(user=self.request.user)
        
        # Filtering by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filtering by proficiency
        proficiency = self.request.query_params.get('proficiency')
        if proficiency:
            queryset = queryset.filter(proficiency=proficiency)

        # Search query
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            queryset = queryset.filter(name__icontains=search.strip())

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
            skill = serializer.save()
            return Response({
                "success": True,
                "data": self.get_serializer(skill).data,
                "message": "Skill saved successfully"
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "data": None,
            "message": "Invalid skill data",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SkillSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Skill.objects.filter(user=self.request.user)

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
            self.perform_update(serializer)
            return Response({
                "success": True,
                "data": serializer.data,
                "message": "Skill updated successfully"
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Skill update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "success": True,
            "data": None,
            "message": "Skill deleted successfully"
        }, status=status.HTTP_200_OK)


class SkillNormalizeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NormalizeSkillSerializer(data=request.data)
        if serializer.is_valid():
            raw = serializer.validated_data['skill']
            canonical = normalize_skill_name(raw)
            category = infer_skill_category(canonical)
            return Response({
                "success": True,
                "data": {
                    "raw": raw,
                    "canonical": canonical,
                    "inferred_category": category
                },
                "message": None
            })
        return Response({
            "success": False,
            "data": None,
            "message": "Invalid payload"
        }, status=status.HTTP_400_BAD_REQUEST)


class SkillStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_skills = Skill.objects.filter(user=request.user)
        total = user_skills.count()

        category_counts = list(
            user_skills.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        proficiency_counts = list(
            user_skills.values('proficiency')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            "success": True,
            "data": {
                "total": total,
                "by_category": category_counts,
                "by_proficiency": proficiency_counts
            },
            "message": None
        })
