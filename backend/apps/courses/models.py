import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class CourseStatus(models.TextChoices):
    PLANNED = 'planned', 'Planned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    PAUSED = 'paused', 'Paused'
    DROPPED = 'dropped', 'Dropped'

class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, null=True)
    provider = models.CharField(max_length=150, blank=True, null=True)  # e.g. Udemy, Coursera, YouTube
    course_url = models.URLField(max_length=1000, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    target_completion_date = models.DateField(blank=True, null=True)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=CourseStatus.choices,
        default=CourseStatus.PLANNED,
        db_index=True
    )
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'progress']),
        ]

    def __str__(self):
        return f"{self.name} ({self.progress}% - {self.get_status_display()})"


class CourseSkill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='course_skills'
    )
    skill_name = models.CharField(max_length=100, db_index=True)

    class Meta:
        unique_together = ('course', 'skill_name')

    def __str__(self):
        return f"{self.skill_name} in {self.course.name}"


class CourseNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    title = models.CharField(max_length=200)
    content = models.TextField()  # Markdown content
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Note '{self.title}' for {self.course.name}"


class RoadmapStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'
    PAUSED = 'paused', 'Paused'
    ARCHIVED = 'archived', 'Archived'


class TopicDifficulty(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class TopicStatus(models.TextChoices):
    NOT_STARTED = 'not_started', 'Not Started'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    SKIPPED = 'skipped', 'Skipped'


class ResourceType(models.TextChoices):
    COURSE = 'course', 'Course'
    TUTORIAL = 'tutorial', 'Tutorial'
    DOCUMENTATION = 'documentation', 'Documentation'
    VIDEO = 'video', 'Video'
    BOOK = 'book', 'Book'
    PROJECT = 'project', 'Project'
    ARTICLE = 'article', 'Article'
    CERTIFICATION = 'certification', 'Certification'


class LearningRoadmap(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='learning_roadmaps'
    )
    title = models.CharField(max_length=250, db_index=True)
    description = models.TextField(blank=True, null=True)
    goal = models.CharField(max_length=250)
    reason = models.CharField(max_length=150, blank=True, null=True)
    current_level = models.CharField(max_length=50, default='intermediate')
    target_level = models.CharField(max_length=50, default='advanced')
    target_role = models.CharField(max_length=200, blank=True, null=True)
    estimated_duration_weeks = models.IntegerField(default=4)
    weekly_hours = models.IntegerField(default=7)
    overall_progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=RoadmapStatus.choices,
        default=RoadmapStatus.ACTIVE,
        db_index=True
    )
    source_job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='roadmaps'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.overall_progress}% - {self.user.email})"

    def recalculate_progress(self):
        topics = RoadmapTopic.objects.filter(roadmap=self)
        total = topics.count()
        if total == 0:
            self.overall_progress = 0
        else:
            completed_or_skipped = topics.filter(status__in=[TopicStatus.COMPLETED, TopicStatus.SKIPPED]).count()
            # Calculate sum of topic progress if not binary
            sum_prog = sum(t.progress for t in topics)
            avg_prog = int(sum_prog / total)
            self.overall_progress = min(100, max(0, avg_prog))
            if self.overall_progress >= 100:
                self.status = RoadmapStatus.COMPLETED
        self.save(update_fields=['overall_progress', 'status', 'updated_at'])


class RoadmapModule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roadmap = models.ForeignKey(
        LearningRoadmap,
        on_delete=models.CASCADE,
        related_name='modules'
    )
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} (Module {self.order} for {self.roadmap.title})"


class RoadmapTopic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roadmap = models.ForeignKey(
        LearningRoadmap,
        on_delete=models.CASCADE,
        related_name='topics'
    )
    module = models.ForeignKey(
        RoadmapModule,
        on_delete=models.CASCADE,
        related_name='topics',
        blank=True,
        null=True
    )
    title = models.CharField(max_length=250, db_index=True)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=1)
    difficulty = models.CharField(
        max_length=20,
        choices=TopicDifficulty.choices,
        default=TopicDifficulty.INTERMEDIATE
    )
    estimated_hours = models.IntegerField(default=4)
    prerequisites = models.JSONField(default=list, blank=True)
    learning_objectives = models.JSONField(default=list, blank=True)
    target_skills = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=TopicStatus.choices,
        default=TopicStatus.NOT_STARTED,
        db_index=True
    )
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} - {self.status} ({self.progress}%)"

    def set_status_and_sync(self, new_status, new_progress=None):
        self.status = new_status
        if new_progress is not None:
            self.progress = new_progress
        elif new_status == TopicStatus.COMPLETED or new_status == TopicStatus.SKIPPED:
            self.progress = 100
        elif new_status == TopicStatus.NOT_STARTED:
            self.progress = 0
        self.save()
        self.roadmap.recalculate_progress()


class LearningResource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='learning_resources'
    )
    topic = models.ForeignKey(
        RoadmapTopic,
        on_delete=models.CASCADE,
        related_name='resources',
        blank=True,
        null=True
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        related_name='roadmap_resources',
        blank=True,
        null=True
    )
    title = models.CharField(max_length=300)
    provider = models.CharField(max_length=150, blank=True, null=True)
    url = models.URLField(max_length=1000)
    resource_type = models.CharField(
        max_length=30,
        choices=ResourceType.choices,
        default=ResourceType.COURSE
    )
    difficulty = models.CharField(max_length=50, blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True, null=True)
    is_free = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    why_recommended = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=TopicStatus.choices,
        default=TopicStatus.NOT_STARTED
    )
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    notes = models.TextField(blank=True, null=True)
    added_to_my_courses = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.provider}) - {self.user.email}"

