from rest_framework import serializers
from .models import Interview, InterviewRoundType, InterviewResult

class InterviewSerializer(serializers.ModelSerializer):
    job_company = serializers.CharField(source='job.company', read_only=True)
    job_role = serializers.CharField(source='job.role', read_only=True)
    job_status = serializers.CharField(source='job.status', read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'job', 'round_type', 'scheduled_at', 'interviewer',
            'result', 'feedback', 'notes', 'job_company', 'job_role',
            'job_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'job', 'created_at', 'updated_at']

    def create(self, validated_data):
        job = self.context['job']
        return Interview.objects.create(job=job, **validated_data)
