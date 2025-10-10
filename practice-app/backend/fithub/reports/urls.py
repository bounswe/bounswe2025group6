# reports/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, AdminReportViewSet, admin_login, admin_check

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'admin/reports', AdminReportViewSet, basename='admin-reports')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/auth/login/', admin_login, name='admin-login'),
    path('admin/auth/check/', admin_check, name='admin-check'),
]