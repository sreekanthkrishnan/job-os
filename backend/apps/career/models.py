import uuid
from django.db import models
from django.conf import settings

class CareerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='career_profile'
    )
    current_role = models.CharField(max_length=200, blank=True, null=True)
    years_of_experience = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    current_ctc = models.CharField(max_length=100, blank=True, null=True)
    expected_ctc_min = models.CharField(max_length=100, blank=True, null=True)
    expected_ctc_max = models.CharField(max_length=100, blank=True, null=True)
    notice_period = models.CharField(max_length=100, blank=True, null=True)  # e.g., "30 Days", "Immediate"
    preferred_locations = models.JSONField(default=list, blank=True)  # e.g., ["Remote", "Bangalore", "Kerala"]
    preferred_work_modes = models.JSONField(default=list, blank=True)  # e.g., ["remote", "hybrid"]
    career_goal = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Career Profile of {self.user.email}"


class TargetRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='target_roles'
    )
    name = models.CharField(max_length=200, db_index=True)  # e.g., "Senior React Developer"
    priority = models.IntegerField(default=1)  # 1 = Primary / highest
    is_primary = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'name']
        unique_together = ('user', 'name')

    def __str__(self):
        primary_str = " (Primary)" if self.is_primary else ""
        return f"{self.name}{primary_str} for {self.user.email}"
