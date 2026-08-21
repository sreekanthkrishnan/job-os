from rest_framework import serializers
from .models import Course, CourseSkill, CourseNote, CourseStatus
from apps.skills.normalizer import normalize_skill_name
from .automation import handle_course_completion

class CourseSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSkill
        fields = ['id', 'skill_name']
        read_only_fields = ['id']

class CourseNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseNote
        fields = ['id', 'course', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'course', 'created_at', 'updated_at']

class CourseSerializer(serializers.ModelSerializer):
    course_skills = CourseSkillSerializer(many=True, read_only=True)
    skills = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=list
    )
    notes_count = serializers.IntegerField(source='notes.count', read_only=True)
    added_skills_on_completion = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'provider', 'course_url',
            'start_date', 'target_completion_date', 'progress',
            'status', 'completed_at', 'course_skills', 'skills',
            'notes_count', 'added_skills_on_completion',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']

    def get_added_skills_on_completion(self, obj):
        if obj.status == CourseStatus.COMPLETED or obj.progress >= 100:
            # List course skill names
            return list(obj.course_skills.values_list('skill_name', flat=True))
        return []

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        user = self.context['request'].user

        # Auto-set status to completed if progress == 100
        if validated_data.get('progress', 0) >= 100:
            validated_data['status'] = CourseStatus.COMPLETED

        course = Course.objects.create(user=user, **validated_data)

        # Process course skills
        seen = set()
        for raw_skill in skills_data:
            norm_name = normalize_skill_name(raw_skill)
            if norm_name and norm_name not in seen:
                seen.add(norm_name)
                CourseSkill.objects.create(course=course, skill_name=norm_name)

        # Trigger completion automation if completed
        if course.status == CourseStatus.COMPLETED or course.progress >= 100:
            handle_course_completion(course)

        return course

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)

        # Auto-set status to completed if progress set to 100
        if validated_data.get('progress', instance.progress) >= 100:
            validated_data['status'] = CourseStatus.COMPLETED

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills_data is not None:
            instance.course_skills.all().delete()
            seen = set()
            for raw_skill in skills_data:
                norm_name = normalize_skill_name(raw_skill)
                if norm_name and norm_name not in seen:
                    seen.add(norm_name)
                    CourseSkill.objects.create(course=instance, skill_name=norm_name)

        # Trigger completion automation if completed
        if instance.status == CourseStatus.COMPLETED or instance.progress >= 100:
            handle_course_completion(instance)

        return instance
