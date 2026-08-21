from django.contrib import admin
from .models import CareerProfile, TargetRole

@admin.register(CareerProfile)
class CareerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_role', 'years_of_experience', 'current_ctc', 'updated_at')
    search_fields = ('user__email', 'current_role')

@admin.register(TargetRole)
class TargetRoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'priority', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'priority')
    search_fields = ('name', 'user__email')
