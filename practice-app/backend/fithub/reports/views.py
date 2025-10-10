from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.contenttypes.models import ContentType
from .models import Report
from .serializers import ReportCreateSerializer, ReportSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

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
    


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Separate login endpoint for admin users
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if user is admin/staff
    if not user.is_staff:
        return Response({
            'error': 'Access denied. Admin privileges required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'message': 'Admin login successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })

@api_view(['GET'])
def admin_check(request):
    """
    Check if current user is admin
    """
    return Response({
        'is_admin': request.user.is_staff,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser
        }
    })

