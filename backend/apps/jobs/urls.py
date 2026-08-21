from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    JobStatusUpdateView,
    JobAnalyzeView,
    JobExportExcelView,
    JobExportCsvView
)

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job_list_create'),
    path('analyze/', JobAnalyzeView.as_view(), name='job_analyze'),
    path('export/excel/', JobExportExcelView.as_view(), name='job_export_excel'),
    path('export/csv/', JobExportCsvView.as_view(), name='job_export_csv'),
    path('<uuid:id>/', JobDetailView.as_view(), name='job_detail'),
    path('<uuid:id>/status/', JobStatusUpdateView.as_view(), name='job_status_update'),
]
