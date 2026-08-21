import uuid
from django.db import models
from apps.jobs.models import Job

class InterviewRoundType(models.TextChoices):
    HR_SCREENING = 'hr_screening', 'HR Screening'
    TECHNICAL = 'technical', 'Technical Round'
    CODING = 'coding', 'Coding Challenge'
    SYSTEM_DESIGN = 'system_design', 'System Design'
    MANAGERIAL = 'managerial', 'Managerial Round'
    HR = 'hr', 'HR Round'
    FINAL = 'final', 'Final Round'
    OTHER = 'other', 'Other'

class InterviewResult(models.TextChoices):
    SCHEDULED = 'scheduled', 'Scheduled'
    COMPLETED = 'completed', 'Completed'
    PASSED = 'passed', 'Passed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    RESCHEDULED = 'rescheduled', 'Rescheduled'

class Interview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='interviews'
    )
    round_type = models.CharField(
        max_length=30,
        choices=InterviewRoundType.choices,
        default=InterviewRoundType.TECHNICAL
    )
    scheduled_at = models.DateTimeField(db_index=True)
    interviewer = models.CharField(max_length=150, blank=True, null=True)
    result = models.CharField(
        max_length=20,
        choices=InterviewResult.choices,
        default=InterviewResult.SCHEDULED,
        db_index=True
    )
    feedback = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']
        indexes = [
            models.Index(fields=['job', 'scheduled_at']),
            models.Index(fields=['result', 'scheduled_at']),
        ]

    def __str__(self):
        return f"{self.get_round_type_display()} for {self.job.role} @ {self.job.company}"
