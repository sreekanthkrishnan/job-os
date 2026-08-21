from django.contrib import admin
from .models import Course, CourseSkill, CourseNote

class CourseSkillInline(admin.TabularInline):
    model = CourseSkill
    extra = 1

class CourseNoteInline(admin.StackedInline):
    model = CourseNote
    extra = 0

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'status', 'progress', 'user', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('name', 'provider', 'user__email')
    ordering = ('-updated_at',)
    inlines = [CourseSkillInline, CourseNoteInline]

@admin.register(CourseNote)
class CourseNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'created_at')
    search_fields = ('title', 'content', 'course__name')
