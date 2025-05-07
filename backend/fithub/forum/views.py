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
permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ForumPostCommentSerializer
    pagination_class = StandardPagination  # Assuming you have a custom pagination class

    def get_queryset(self):
        """
        Get the comments for a specific post.
        """
        post = ForumPost.objects.get(id=self.kwargs['post_id'])
        return post.comments.filter(is_deleted=False)  # Only return non-deleted comments

    def perform_create(self, serializer):
        """
        Create a new comment associated with a post and user.
        """
        post = ForumPost.objects.get(id=self.kwargs['post_id'])
        serializer.save(author=self.request.user, post=post)

    def create(self, request, *args, **kwargs):
        """
        Handle the creation of a comment.
        """
        kwargs['post_id'] = self.kwargs['post_id']
        return super().create(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        """
        List all comments for a specific post.
        """
        post = ForumPost.objects.get(id=self.kwargs['post_id'])
        comments = post.comments.filter(is_deleted=False)
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = ForumPostCommentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ForumPostCommentSerializer(comments, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Get a single comment's details.
        """
        comment = self.get_object()
        serializer = ForumPostCommentSerializer(comment)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete (soft delete) a comment.
        Only the author can delete their comment.
        """
        comment = self.get_object()

        if comment.author != request.user:
            return Response({"detail": "You cannot delete a comment you did not create."}, status=status.HTTP_403_FORBIDDEN)

        # Perform soft delete (mark as deleted)
        comment.is_deleted = True
        comment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)