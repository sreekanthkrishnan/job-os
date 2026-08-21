from django.contrib import admin
from .models import Interview

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('round_type', 'job', 'scheduled_at', 'interviewer', 'result', 'created_at')
    list_filter = ('round_type', 'result', 'scheduled_at')
    search_fields = ('job__company', 'job__role', 'interviewer')
    ordering = ('scheduled_at',)
