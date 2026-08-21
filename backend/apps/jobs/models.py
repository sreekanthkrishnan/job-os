import uuid
from django.db import models
from django.conf import settings

class JobStatus(models.TextChoices):
    WISHLIST = 'wishlist', 'Wishlist'
    APPLIED = 'applied', 'Applied'
    SCREENING = 'screening', 'Screening'
    INTERVIEW = 'interview', 'Interview'
    TECHNICAL = 'technical', 'Technical Round'
    MANAGERIAL = 'managerial', 'Managerial Round'
    HR = 'hr', 'HR Round'
    OFFER = 'offer', 'Offer'
    ACCEPTED = 'accepted', 'Accepted'
    REJECTED = 'rejected', 'Rejected'
    WITHDRAWN = 'withdrawn', 'Withdrawn'
    ON_HOLD = 'on_hold', 'On Hold'

class WorkMode(models.TextChoices):
    REMOTE = 'remote', 'Remote'
    HYBRID = 'hybrid', 'Hybrid'
    ONSITE = 'onsite', 'Onsite'

class EmploymentType(models.TextChoices):
    FULL_TIME = 'full_time', 'Full Time'
    PART_TIME = 'part_time', 'Part Time'
    CONTRACT = 'contract', 'Contract'
    INTERNSHIP = 'internship', 'Internship'

class Job(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    company = models.CharField(max_length=200, db_index=True)
    role = models.CharField(max_length=200, db_index=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    work_mode = models.CharField(
        max_length=20,
        choices=WorkMode.choices,
        default=WorkMode.REMOTE
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME
    )
    experience_required = models.CharField(max_length=100, blank=True, null=True)
    salary = models.CharField(max_length=100, blank=True, null=True)
    applied_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=30,
        choices=JobStatus.choices,
        default=JobStatus.APPLIED,
        db_index=True
    )
    job_url = models.URLField(max_length=1000, blank=True, null=True)
    raw_description = models.TextField(blank=True, null=True)
    match_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        db_index=True
    )
    applied_resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applied_jobs'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'applied_date']),
            models.Index(fields=['user', 'company']),
            models.Index(fields=['user', 'role']),
        ]

    def __str__(self):
        return f"{self.role} at {self.company} ({self.get_status_display()})"


class JobSkill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='job_skills'
    )
    skill_name = models.CharField(max_length=100, db_index=True)
    is_required = models.BooleanField(default=True)  # True = Required, False = Preferred

    class Meta:
        unique_together = ('job', 'skill_name')

    def __str__(self):
        req_str = "Required" if self.is_required else "Preferred"
        return f"{self.skill_name} ({req_str}) for {self.job.role} @ {self.job.company}"
