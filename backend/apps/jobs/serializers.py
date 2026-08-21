from rest_framework import serializers
from .models import Job, JobSkill, JobStatus, WorkMode, EmploymentType
from apps.skills.normalizer import normalize_skill_name
from .matcher import calculate_job_match, recalculate_and_save_job_match

class JobSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSkill
        fields = ['id', 'skill_name', 'is_required']
        read_only_fields = ['id']

class JobSerializer(serializers.ModelSerializer):
    job_skills = JobSkillSerializer(many=True, read_only=True)
    skills = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=list
    )
    matching_skills = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'company', 'role', 'location', 'work_mode',
            'employment_type', 'experience_required', 'salary',
            'applied_date', 'status', 'job_url', 'raw_description',
            'match_score', 'job_skills', 'skills', 'matching_skills',
            'missing_skills', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'match_score', 'created_at', 'updated_at']

    def get_matching_skills(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            _, matching, _, _ = calculate_job_match(request.user, obj)
            return matching
        return []

    def get_missing_skills(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            _, _, missing, _ = calculate_job_match(request.user, obj)
            return missing
        return []

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        user = self.context['request'].user
        job = Job.objects.create(user=user, **validated_data)

        # Process skills
        seen_skills = set()
        for raw_skill in skills_data:
            norm_name = normalize_skill_name(raw_skill)
            if norm_name and norm_name not in seen_skills:
                seen_skills.add(norm_name)
                JobSkill.objects.create(job=job, skill_name=norm_name, is_required=True)

        # Calculate initial match score
        recalculate_and_save_job_match(user, job)
        return job

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills_data is not None:
            # Re-sync skills
            instance.job_skills.all().delete()
            seen_skills = set()
            for raw_skill in skills_data:
                norm_name = normalize_skill_name(raw_skill)
                if norm_name and norm_name not in seen_skills:
                    seen_skills.add(norm_name)
                    JobSkill.objects.create(job=instance, skill_name=norm_name, is_required=True)

        # Recalculate match score
        user = self.context['request'].user
        recalculate_and_save_job_match(user, instance)
        return instance


class JobStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['status']
