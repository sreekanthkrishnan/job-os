import uuid
from django.db import models
from django.conf import settings

class SkillCategory(models.TextChoices):
    FRONTEND = 'frontend', 'Frontend'
    BACKEND = 'backend', 'Backend'
    DATABASE = 'database', 'Database'
    DEVOPS = 'devops', 'DevOps'
    CLOUD = 'cloud', 'Cloud'
    TESTING = 'testing', 'Testing'
    AI_ML = 'ai_ml', 'AI / ML'
    SOFT_SKILLS = 'soft_skills', 'Soft Skills'
    TOOLS = 'tools', 'Tools'
    OTHER = 'other', 'Other'

class SkillProficiency(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'
    EXPERT = 'expert', 'Expert'

class SkillSource(models.TextChoices):
    MANUAL = 'manual', 'Manual'
    COURSE = 'course', 'Course'
    IMPORTED = 'imported', 'Imported'

class Skill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skills'
    )
    name = models.CharField(max_length=100, db_index=True)
    category = models.CharField(
        max_length=30,
        choices=SkillCategory.choices,
        default=SkillCategory.OTHER,
        db_index=True
    )
    proficiency = models.CharField(
        max_length=20,
        choices=SkillProficiency.choices,
        default=SkillProficiency.INTERMEDIATE
    )
    source = models.CharField(
        max_length=20,
        choices=SkillSource.choices,
        default=SkillSource.MANUAL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('user', 'name')
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_proficiency_display()}) - {self.user.email}"


class SkillAlias(models.Model):
    """
    Centralized Taxonomy & Skill Normalization Alias System.
    Maps non-canonical variants (e.g. 'ReactJS', 'React.js', 'React JS')
    to a canonical skill name ('React').
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alias = models.CharField(max_length=100, unique=True, db_index=True)
    canonical_name = models.CharField(max_length=100, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Skill Aliases"
        ordering = ['canonical_name', 'alias']

    def __str__(self):
        return f"{self.alias} -> {self.canonical_name}"
