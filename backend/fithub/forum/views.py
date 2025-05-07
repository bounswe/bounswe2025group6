# forum/views.py
from rest_framework import viewsets
from utils.pagination import StandardPagination
from forum.models import ForumPost, ForumPostComment
from forum.serializers import ForumPostSerializer, ForumPostCommentSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import permission_classes
from rest_framework.response import Response


@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.filter(deleted_on__isnull=True).order_by('-created_at') # Order by created_at descending (only show non-deleted posts)
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

@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostCommentViewSet(viewsets.ModelViewSet):
    queryset = ForumPostComment.objects.all().order_by('-created_at')  # Order comments by creation date
    serializer_class = ForumPostCommentSerializer

    # We want to filter the comments for a specific post
    def get_queryset(self):
        post = ForumPost.objects.get(id=self.kwargs['post_id'])
        return post.comments.all()

    def perform_create(self, serializer):
        post = ForumPost.objects.get(id=self.kwargs['post_id'])
        serializer.save(author=self.request.user, post=post)

    def create(self, request, *args, **kwargs):
        # We can directly access the post_id in the URL, so we pass it to the serializer
        kwargs['post_id'] = self.kwargs['post_id']
        return super().create(request, *args, **kwargs)