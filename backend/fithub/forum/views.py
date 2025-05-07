# forum/views.py
from rest_framework import viewsets
from utils.pagination import StandardPagination
from forum.models import ForumPost
from forum.serializers import ForumPostSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import permission_classes
from rest_framework.response import Response


@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.all().order_by('-created_at') # Order by created_at descending
    serializer_class = ForumPostSerializer
    pagination_class = StandardPagination

    http_method_names = ['get', 'post', 'put', 'delete']  # Disable PATCH


    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # Treat PUT as partial update
        return super().update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):

        # Get the post instance
        post = self.get_object()

        # Increment view count whenever a post is viewed
        post.view_count += 1
        post.save()

        # Serialize and return the post
        serializer = self.get_serializer(post)
        return Response(serializer.data)