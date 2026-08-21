from django.urls import path
from .views import (
    CourseListCreateView,
    CourseDetailView,
    CourseNoteListCreateView,
    CourseNoteDetailView
)

urlpatterns = [
    path('', CourseListCreateView.as_view(), name='course_list_create'),
    path('<uuid:id>/', CourseDetailView.as_view(), name='course_detail'),
    path('<uuid:course_id>/notes/', CourseNoteListCreateView.as_view(), name='course_note_list_create'),
    path('notes/<uuid:id>/', CourseNoteDetailView.as_view(), name='course_note_detail'),
]
