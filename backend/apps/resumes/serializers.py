from rest_framework import serializers
from apps.resumes.models import (
    Resume, ResumeVersion, ResumeSkill,
    ResumeJobAnalysis, ResumeOptimization, OutreachMessage
)

class ResumeSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeSkill
        fields = ['id', 'name', 'category', 'experience_years']

class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = [
            'id', 'version_number', 'target_job', 'notes',
            'content_changes', 'raw_text', 'parsed_data', 'created_at'
        ]

class ResumeSerializer(serializers.ModelSerializer):
    resume_skills = ResumeSkillSerializer(many=True, read_only=True)
    versions_count = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id', 'name', 'file', 'file_url', 'file_type', 'file_size',
            'target_role', 'description', 'version', 'is_active',
            'parsed_status', 'analysis_status', 'raw_text', 'parsed_data',
            'resume_skills', 'versions_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_type', 'file_size', 'parsed_status',
            'analysis_status', 'raw_text', 'parsed_data', 'created_at', 'updated_at'
        ]

    def get_versions_count(self, obj) -> int:
        return obj.versions.count()

    def get_file_url(self, obj) -> str:
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return ""

class ResumeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['name', 'file', 'target_role', 'description', 'version']


class ResumeJobAnalysisSerializer(serializers.ModelSerializer):
    resume_name = serializers.CharField(source='resume.name', read_only=True)
    resume_version = serializers.IntegerField(source='resume.version', read_only=True)

    class Meta:
        model = ResumeJobAnalysis
        fields = [
            'id', 'resume', 'resume_name', 'resume_version', 'job',
            'suitability_score', 'skill_match_score', 'experience_match_score',
            'role_match_score', 'seniority_match_score', 'keyword_score',
            'domain_score', 'ats_score', 'ai_call_probability_estimate',
            'ai_confidence', 'matching_skills', 'missing_skills',
            'strengths', 'weaknesses', 'evidence', 'analysis_json',
            'is_recommended', 'created_at', 'updated_at'
        ]


class ResumeOptimizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeOptimization
        fields = [
            'id', 'resume', 'job', 'current_score', 'potential_score',
            'potential_improvement', 'missing_keywords', 'weak_sections',
            'suggested_improvements', 'ats_formatting_concerns', 'created_at'
        ]


class OutreachMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutreachMessage
        fields = [
            'id', 'job', 'resume', 'channel', 'tone', 'recipient_name',
            'recipient_role', 'subject_lines', 'selected_subject', 'body',
            'created_at', 'updated_at'
        ]
