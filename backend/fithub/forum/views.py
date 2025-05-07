# forum/views.py
from rest_framework import viewsets
from forum.models import ForumPost
from utils.models import Tag
from forum.serializers import ForumPostSerializer, TagSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.all().order_by('-created_at')
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
