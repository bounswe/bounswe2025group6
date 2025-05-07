# forum/views.py
from rest_framework import viewsets
from forum.models import ForumPost
from forum.serializers import ForumPostSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import permission_classes


@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.all().order_by('-created_at') # Order by created_at descending
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

