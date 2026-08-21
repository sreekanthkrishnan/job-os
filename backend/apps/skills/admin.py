from django.contrib import admin
from .models import Skill, SkillAlias

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'proficiency', 'source', 'user', 'created_at')
    list_filter = ('category', 'proficiency', 'source', 'created_at')
    search_fields = ('name', 'user__email')
    ordering = ('name',)

@admin.register(SkillAlias)
class SkillAliasAdmin(admin.ModelAdmin):
    list_display = ('alias', 'canonical_name', 'created_at')
    search_fields = ('alias', 'canonical_name')
    ordering = ('canonical_name', 'alias')
