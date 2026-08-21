from rest_framework import serializers
from .models import (
    Course, CourseSkill, CourseNote, CourseStatus,
    LearningRoadmap, RoadmapModule, RoadmapTopic, LearningResource,
    RoadmapStatus, TopicDifficulty, TopicStatus, ResourceType
)
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
            return list(obj.course_skills.values_list('skill_name', flat=True))
        return []

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        user = self.context['request'].user

        if validated_data.get('progress', 0) >= 100:
            validated_data['status'] = CourseStatus.COMPLETED

        course = Course.objects.create(user=user, **validated_data)

        seen = set()
        for raw_skill in skills_data:
            norm_name = normalize_skill_name(raw_skill)
            if norm_name and norm_name not in seen:
                seen.add(norm_name)
                CourseSkill.objects.create(course=course, skill_name=norm_name)

        if course.status == CourseStatus.COMPLETED or course.progress >= 100:
            handle_course_completion(course)

        return course

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)

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

        if instance.status == CourseStatus.COMPLETED or instance.progress >= 100:
            handle_course_completion(instance)

        return instance


class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = [
            'id', 'topic', 'course', 'title', 'provider', 'url',
            'resource_type', 'difficulty', 'duration', 'is_free',
            'rating', 'why_recommended', 'status', 'progress',
            'notes', 'added_to_my_courses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoadmapTopicSerializer(serializers.ModelSerializer):
    resources = LearningResourceSerializer(many=True, read_only=True)
    resources_count = serializers.IntegerField(source='resources.count', read_only=True)

    class Meta:
        model = RoadmapTopic
        fields = [
            'id', 'roadmap', 'module', 'title', 'description', 'order',
            'difficulty', 'estimated_hours', 'prerequisites',
            'learning_objectives', 'target_skills', 'status',
            'progress', 'notes', 'resources', 'resources_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'roadmap', 'created_at', 'updated_at']


class RoadmapModuleSerializer(serializers.ModelSerializer):
    topics = RoadmapTopicSerializer(many=True, read_only=True)

    class Meta:
        model = RoadmapModule
        fields = [
            'id', 'roadmap', 'title', 'description', 'order', 'topics', 'created_at'
        ]
        read_only_fields = ['id', 'roadmap', 'created_at']


class LearningRoadmapSerializer(serializers.ModelSerializer):
    modules = RoadmapModuleSerializer(many=True, read_only=True)
    topics = RoadmapTopicSerializer(many=True, read_only=True)
    completed_topics_count = serializers.SerializerMethodField()
    total_topics_count = serializers.SerializerMethodField()
    total_estimated_hours = serializers.SerializerMethodField()

    class Meta:
        model = LearningRoadmap
        fields = [
            'id', 'title', 'description', 'goal', 'reason',
            'current_level', 'target_level', 'target_role',
            'estimated_duration_weeks', 'weekly_hours',
            'overall_progress', 'status', 'source_job',
            'modules', 'topics', 'completed_topics_count',
            'total_topics_count', 'total_estimated_hours',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'overall_progress', 'created_at', 'updated_at']

    def get_completed_topics_count(self, obj):
        return obj.topics.filter(status__in=[TopicStatus.COMPLETED, TopicStatus.SKIPPED]).count()

    def get_total_topics_count(self, obj):
        return obj.topics.count()

    def get_total_estimated_hours(self, obj):
        return sum(t.estimated_hours for t in obj.topics.all())


class CreateRoadmapPayloadSerializer(serializers.Serializer):
    goal = serializers.CharField(max_length=250, required=True)
    reason = serializers.CharField(max_length=150, required=False, default="upskilling")
    current_level = serializers.CharField(max_length=50, required=False, default="intermediate")
    target_level = serializers.CharField(max_length=50, required=False, default="advanced")
    weekly_hours = serializers.IntegerField(required=False, default=7)
    target_role = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    target_date = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")


class DiscoverResourcesPayloadSerializer(serializers.Serializer):
    topic_title = serializers.CharField(max_length=250, required=True)
    topic_description = serializers.CharField(required=False, allow_blank=True, default="")
    target_skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    user_level = serializers.CharField(max_length=50, required=False, default="intermediate")
