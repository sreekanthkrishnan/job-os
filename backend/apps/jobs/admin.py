from django.contrib import admin
from .models import Job, JobSkill

class JobSkillInline(admin.TabularInline):
    model = JobSkill
    extra = 1

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('role', 'company', 'status', 'work_mode', 'match_score', 'applied_date', 'user')
    list_filter = ('status', 'work_mode', 'employment_type', 'applied_date')
    search_fields = ('company', 'role', 'user__email')
    ordering = ('-applied_date',)
    inlines = [JobSkillInline]
