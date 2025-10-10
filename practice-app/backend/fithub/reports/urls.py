# reports/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, AdminReportViewSet

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'admin/reports', AdminReportViewSet, basename='admin-reports')

urlpatterns = [
    path('', include(router.urls)),
]