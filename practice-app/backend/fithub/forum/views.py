# forum/views.py
from rest_framework import viewsets
from utils.pagination import StandardPagination
from forum.models import ForumPost, ForumPostVote, ForumPostComment, ForumPostCommentVote
from forum.serializers import ForumPostSerializer, ForumPostVoteSerializer, ForumPostCommentSerializer, ForumPostCommentVoteSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404
from rest_framework.decorators import permission_classes, action
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
class ForumPostVoteView(APIView):

    @swagger_auto_schema(
        operation_description="Submit a vote on a forum post.",
        request_body=ForumPostVoteSerializer,
        responses={
            201: openapi.Response(description="Vote recorded successfully!"),
            400: openapi.Response(description="Bad request — validation error.")
        }
    )
    def post(self, request, *args, **kwargs):
        post_id = kwargs.get('post_id')
        post = get_object_or_404(ForumPost, pk=post_id)

        serializer = ForumPostVoteSerializer(
            data=request.data,
            context={'user': request.user, 'post': post}
        )
        if serializer.is_valid():
            serializer.save()

            # Update vote count based on vote type
            vote_type = request.data.get("vote_type")

            if vote_type == 'up':
                post.increment_upvote()
            elif vote_type == 'down':
                post.increment_downvote()

            return Response({"message": "Vote recorded successfully!"}, status=status.HTTP_201_CREATED)

        return Response({"message": "You have already voted on this post!"}, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Check if the authenticated user has voted on a forum post.",
        responses={
            200: openapi.Response(description="Vote found", examples={
                "application/json": {
                    "user_id": 1,
                    "post_id": 123,
                    "vote_type": "up"
                }
            }),
            204: openapi.Response(description="No vote found"),
            401: openapi.Response(description="User not authenticated"),
            404: openapi.Response(description="Post not found"),
        }
    )
    def get(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)


        post_id = kwargs.get('post_id')
        post = get_object_or_404(ForumPost, pk=post_id, deleted_on__isnull=True)

        vote = ForumPostVote.objects.filter(user=request.user, post=post, deleted_on__isnull=True).first()

        if vote:
            return Response({
                "user_id": request.user.id,
                "post_id": post.id,
                "vote_type": vote.vote_type,
            }, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        operation_description="Delete a vote on a forum post.",
        responses={
            204: openapi.Response(description="Vote deleted successfully!"),
            400: openapi.Response(description="Bad request — validation error."),
            404: openapi.Response(description="Vote or post not found."),
        }
    )
    def delete(self, request, *args, **kwargs):
        post_id = kwargs.get('post_id')
        post = get_object_or_404(ForumPost, pk=post_id)

        # Find the user's vote for the post
        vote = ForumPostVote.objects.filter(user=request.user, post=post, deleted_on__isnull=True).first()  # Update filter to use post

        if not vote:
            return Response({"message": "No vote found to delete for this post."}, status=status.HTTP_404_NOT_FOUND)

        # Delete the vote
        vote.delete()

        # Update vote count based on vote type
        vote_type = vote.vote_type

        if vote_type == 'up':
            post.decrement_upvote()
        elif vote_type == 'down':
            post.decrement_downvote()

        return Response({"message": "Vote deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)


### VIEWS FOR COMMENTS ###

@permission_classes([IsAuthenticatedOrReadOnly])
class ForumPostCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ForumPostCommentSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        """
        Get the comments for a specific post.
        """
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(ForumPost, id=post_id)
        return post.comments.filter(deleted_on__isnull=True)

    def create(self, request, *args, **kwargs):
        post = get_object_or_404(ForumPost, id=self.kwargs['post_id'])
        serializer = self.get_serializer(data=request.data)
        serializer.context['post'] = post

        try:
            serializer.is_valid(raise_exception=True)
            serializer.save(author=request.user, post=post)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            message = str(e.detail)

            if "deleted post" in message.lower():
                return Response({"detail": e.detail}, status=status.HTTP_404_NOT_FOUND)
            elif "non-commentable" in message.lower():
                return Response({"detail": e.detail}, status=status.HTTP_403_FORBIDDEN)
            elif "reply to a comment from a different post" in message.lower():
                return Response({"detail": e.detail}, status=status.HTTP_409_CONFLICT)
            else:
                return Response({"detail": e.detail}, status=status.HTTP_400_BAD_REQUEST)

    # Leave perform_create clean
    def perform_create(self, serializer):
        post = self.serializer_context['post']
        serializer.save(author=self.request.user, post=post)

    def list(self, request, *args, **kwargs):
        """
        List all comments for a specific post.
        """
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(ForumPost, id=post_id)

        if post.deleted_on:
            return Response({"detail": "Post is deleted."}, status=status.HTTP_404_NOT_FOUND)
        if not post.is_commentable:
            return Response({"detail": "Comments are disabled for this post."}, status=status.HTTP_403_FORBIDDEN)

        comments = post.comments.filter(deleted_on__isnull=True)
        page = self.paginate_queryset(comments)
        serializer = self.get_serializer(page if page is not None else comments, many=True)

        return self.get_paginated_response(serializer.data) if page else Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Get a single comment's details.
        """
        post_id = self.kwargs.get('post_id')
        comment_id = self.kwargs.get('comment_id')

        post = get_object_or_404(ForumPost, id=post_id)
        if post.deleted_on:
            return Response({"detail": "Post is deleted."}, status=status.HTTP_404_NOT_FOUND)
        if not post.is_commentable:
            return Response({"detail": "Comments are disabled for this post."}, status=status.HTTP_403_FORBIDDEN)

        comment = get_object_or_404(post.comments.filter(deleted_on__isnull=True), id=comment_id)

        serializer = self.get_serializer(comment)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete (soft delete) a comment.
        Only the author can delete their comment.
        """
        # Get the comment instance, if it exists
        comment = get_object_or_404(self.get_queryset(), id=self.kwargs['comment_id'])

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

            # Update vote count based on vote type
            vote_type = request.data.get("vote_type")

            if vote_type == 'up':
                comment.increment_upvote()
            elif vote_type == 'down':
                comment.increment_downvote()

            return Response({"message": "Vote recorded successfully!"}, status=status.HTTP_201_CREATED)

        return Response({"message": "You have already voted on this comment!"}, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Check if the authenticated user has voted on a forum post comment.",
        responses={
            200: openapi.Response(description="Vote found", examples={
                "application/json": {
                    "user_id": 1,
                    "comment_id": 456,
                    "vote_type": "up"
                }
            }),
            204: openapi.Response(description="No vote found"),
            401: openapi.Response(description="User not authenticated"),
            404: openapi.Response(description="Comment not found"),
        }
    )
    def get(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(ForumPostComment, pk=comment_id, deleted_on__isnull=True)

        vote = ForumPostCommentVote.objects.filter(user=request.user, comment=comment, deleted_on__isnull=True).first()

        if vote:
            return Response({
                "user_id": request.user.id,
                "comment_id": comment.id,
                "vote_type": vote.vote_type,
            }, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)


    @swagger_auto_schema(
        operation_description="Delete a vote on a forum post comment.",
        responses={
            204: openapi.Response(description="Vote deleted successfully!"),
            400: openapi.Response(description="Bad request — validation error."),
            404: openapi.Response(description="Vote or comment not found."),
        }
    )
    def delete(self, request, *args, **kwargs):
        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(ForumPostComment, pk=comment_id)

        # Find the user's vote for the comment
        vote = ForumPostCommentVote.objects.filter(user=request.user, comment=comment, deleted_on__isnull=True).first()

        if not vote:
            return Response({"message": "No vote found to delete for this comment."}, status=status.HTTP_404_NOT_FOUND)

        # Delete the vote
        vote.delete()

        # Update vote count based on vote type
        vote_type = vote.vote_type

        if vote_type == 'up':
            comment.decrement_upvote()
        elif vote_type == 'down':
            comment.decrement_downvote()

        return Response({"message": "Vote deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)
