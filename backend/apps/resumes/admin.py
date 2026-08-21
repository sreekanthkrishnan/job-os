from django.contrib import admin
from apps.resumes.models import (
    Resume, ResumeVersion, ResumeSkill,
    ResumeJobAnalysis, ResumeOptimization, OutreachMessage
)

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'target_role', 'version', 'is_active', 'parsed_status', 'created_at')
    list_filter = ('is_active', 'parsed_status', 'file_type')
    search_fields = ('name', 'user__email', 'target_role')

@admin.register(ResumeVersion)
class ResumeVersionAdmin(admin.ModelAdmin):
    list_display = ('resume', 'version_number', 'target_job', 'created_at')
    search_fields = ('resume__name', 'notes')

@admin.register(ResumeJobAnalysis)
class ResumeJobAnalysisAdmin(admin.ModelAdmin):
    list_display = ('resume', 'job', 'suitability_score', 'ai_call_probability_estimate', 'is_recommended', 'created_at')
    list_filter = ('is_recommended', 'ai_confidence')
    search_fields = ('resume__name', 'job__company', 'job__role')

@admin.register(ResumeOptimization)
class ResumeOptimizationAdmin(admin.ModelAdmin):
    list_display = ('resume', 'job', 'current_score', 'potential_score', 'potential_improvement', 'created_at')

@admin.register(OutreachMessage)
class OutreachMessageAdmin(admin.ModelAdmin):
    list_display = ('job', 'user', 'channel', 'tone', 'recipient_name', 'created_at')
    list_filter = ('channel', 'tone')
