# forum/views.py
from rest_framework import viewsets
from utils.pagination import StandardPagination
from forum.models import ForumPost, ForumPostComment
from forum.serializers import ForumPostSerializer, ForumPostCommentSerializer, ForumPostCommentVoteSerializer, ForumPostCommentReportSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404
from rest_framework.decorators import permission_classes
from django.utils.timezone import now

@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.filter(deleted_on__isnull=True).order_by('-created_at') # Order by created_at descending (only non-deleted posts)
    serializer_class = ForumPostSerializer
    pagination_class = StandardPagination

    http_method_names = ['get', 'post', 'put', 'delete']  # Disable PATCH

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # Treat PUT as partial update
        return super().update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        post = self.get_object() # Get the post instance

        # Increment view count whenever a post is viewed
        post.view_count += 1
        post.save()

        # Serialize and return the post
        serializer = self.get_serializer(post)
        return Response(serializer.data)

@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ForumPostCommentSerializer
    pagination_class = StandardPagination  # Assuming you have a custom pagination class

    def get_queryset(self):
        """
        Get the comments for a specific post.
        """
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(ForumPost, id=post_id)
        return post.comments.filter(deleted_on__isnull=True)

    def perform_create(self, serializer):
        """
        Create a new comment associated with a post and user.
        """
        post = ForumPost.objects.get(id=self.kwargs['post_id'])

        # Check if the post is commentable before saving the comment
        if not post.is_commentable:
            raise serializers.ValidationError("Cannot comment on a non-commentable post")

        # Save the comment with the associated post and user
        serializer.save(author=self.request.user, post=post)

    def list(self, request, *args, **kwargs):
        """
        List all comments for a specific post.
        """
        post = ForumPost.objects.get(id=self.kwargs['post_id'])
        comments = post.comments.filter(deleted_on__isnull=True)
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Get a single comment's details.
        """

        # Get the comment instance, if it exists
        try:
            comment = self.get_queryset().get(id=self.kwargs['comment_id'])
        except ObjectDoesNotExist:
            return Response({"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(comment)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete (soft delete) a comment.
        Only the author can delete their comment.
        """
        # Get the comment instance, if it exists
        try:
            comment = self.get_queryset().get(id=self.kwargs['comment_id'])
        except ObjectDoesNotExist:
            return Response({"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is the author of the comment
        if comment.author != request.user:
            return Response({"detail": "You cannot delete a comment you did not create."}, status=status.HTTP_403_FORBIDDEN)

        # Perform soft delete (mark as deleted)
        comment.deleted_on = now()
        comment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostCommentVoteView(APIView):

    @swagger_auto_schema(
        operation_description="Submit a vote on a forum post comment.",
        request_body=ForumPostCommentVoteSerializer,
        responses={
            201: openapi.Response(description="Vote recorded successfully!"),
            400: openapi.Response(description="Bad request — validation error.")
        }
    )
    def post(self, request, *args, **kwargs):
        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(ForumPostComment, pk=comment_id)

        serializer = ForumPostCommentVoteSerializer(
            data=request.data,
            context={'user': request.user, 'comment': comment}
        )
        if serializer.is_valid():
            serializer.save() 
            return Response({"message": "Vote recorded successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostCommentReportView(APIView):

    @swagger_auto_schema(
        operation_description="Report a forum post comment for review.",
        request_body=ForumPostCommentReportSerializer,
        responses={
            201: openapi.Response(description="Report submitted successfully!"),
            400: openapi.Response(description="Bad request — validation error.")
        }
    )
    def post(self, request, *args, **kwargs):
        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(ForumPostComment, pk=comment_id)

        serializer = ForumPostCommentReportSerializer(
            data=request.data,
            context={'user': request.user, 'comment': comment}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Report submitted successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)