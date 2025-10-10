from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.contenttypes.models import ContentType
from .models import Report
from .serializers import ReportCreateSerializer, ReportSerializer

class ReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReportCreateSerializer
        return ReportSerializer
    
    def get_queryset(self):
        if getattr(self.request.user, 'is_staff', False):
            return Report.objects.select_related('reporter', 'content_type').all()
        return Report.objects.filter(reporter=self.request.user)
    
    # def perform_create(self, serializer):
    #     serializer.save(reporter=self.request.user)

class AdminReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ReportSerializer
    queryset = Report.objects.select_related('reporter', 'content_type').all()
    
    @action(detail=True, methods=['post'])
    def resolve_keep(self, request, pk=None):
        """Resolve report by keeping the content"""
        report = self.get_object()
        report.status = 'resolved'
        report.save()
        return Response({'status': 'Report resolved - content kept'})
    
    @action(detail=True, methods=['post'])
    def resolve_delete(self, request, pk=None):
        """Resolve report by deleting the content"""
        report = self.get_object()
        content_object = report.content_object
        
        # Delete the reported content
        content_object.delete()
        
        report.status = 'resolved'
        report.save()
        
        return Response({'status': 'Report resolved - content deleted'})