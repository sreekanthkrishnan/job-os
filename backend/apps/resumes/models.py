import uuid
from django.db import models
from django.conf import settings
from apps.jobs.models import Job

class ResumeParseStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'

class OutreachChannel(models.TextChoices):
    EMAIL = 'email', 'Cold Email'
    LINKEDIN = 'linkedin', 'LinkedIn'

class OutreachTone(models.TextChoices):
    PROFESSIONAL = 'professional', 'Professional'
    CONCISE = 'concise', 'Concise'
    CONFIDENT = 'confident', 'Confident'
    FRIENDLY = 'friendly', 'Friendly'
    TECHNICAL = 'technical', 'Technical'

class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    name = models.CharField(max_length=200, db_index=True)
    file = models.FileField(upload_to='resumes/%Y/%m/')
    file_type = models.CharField(max_length=20, default='pdf')  # pdf, docx
    file_size = models.IntegerField(default=0)  # in bytes
    target_role = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    parsed_status = models.CharField(
        max_length=20,
        choices=ResumeParseStatus.choices,
        default=ResumeParseStatus.PENDING
    )
    analysis_status = models.CharField(
        max_length=20,
        choices=ResumeParseStatus.choices,
        default=ResumeParseStatus.PENDING
    )
    raw_text = models.TextField(blank=True, null=True)
    parsed_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'target_role']),
        ]

    def __str__(self):
        return f"{self.name} (v{self.version}) - {self.user.email}"


class ResumeVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version_number = models.IntegerField()
    target_job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resume_versions'
    )
    notes = models.TextField(blank=True, null=True)
    content_changes = models.JSONField(default=list, blank=True)
    raw_text = models.TextField(blank=True, null=True)
    parsed_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ('resume', 'version_number')

    def __str__(self):
        return f"{self.resume.name} v{self.version_number}"


class ResumeSkill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='resume_skills'
    )
    name = models.CharField(max_length=100, db_index=True)
    category = models.CharField(max_length=50, default='other')
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    class Meta:
        unique_together = ('resume', 'name')

    def __str__(self):
        return f"{self.name} on {self.resume.name}"


class ResumeJobAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='job_analyses'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='resume_analyses'
    )
    suitability_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, db_index=True)
    skill_match_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    experience_match_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    role_match_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    seniority_match_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    keyword_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    domain_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    ats_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    ai_call_probability_estimate = models.IntegerField(default=50)  # 0 to 100 percentage
    ai_confidence = models.CharField(max_length=20, default='Medium')  # Low, Medium, High

    matching_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    evidence = models.JSONField(default=list, blank=True)
    analysis_json = models.JSONField(default=dict, blank=True)
    is_recommended = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-suitability_score']
        unique_together = ('resume', 'job')
        indexes = [
            models.Index(fields=['job', 'suitability_score']),
            models.Index(fields=['resume', 'job']),
        ]

    def __str__(self):
        return f"Analysis: {self.resume.name} for {self.job.role} @ {self.job.company} ({self.suitability_score}%)"


class ResumeOptimization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='optimizations'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='resume_optimizations'
    )
    current_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    potential_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    potential_improvement = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    missing_keywords = models.JSONField(default=list, blank=True)
    weak_sections = models.JSONField(default=list, blank=True)
    suggested_improvements = models.JSONField(default=list, blank=True)
    ats_formatting_concerns = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Optimization for {self.resume.name} -> {self.job.role}"


class OutreachMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='outreach_messages'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='outreach_messages'
    )
    resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='outreach_messages'
    )
    channel = models.CharField(
        max_length=20,
        choices=OutreachChannel.choices,
        default=OutreachChannel.EMAIL
    )
    tone = models.CharField(
        max_length=30,
        choices=OutreachTone.choices,
        default=OutreachTone.PROFESSIONAL
    )
    recipient_name = models.CharField(max_length=200, blank=True, null=True)
    recipient_role = models.CharField(max_length=200, blank=True, null=True)
    subject_lines = models.JSONField(default=list, blank=True)
    selected_subject = models.CharField(max_length=300, blank=True, null=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_channel_display()} for {self.job.role} @ {self.job.company}"
