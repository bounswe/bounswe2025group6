from rest_framework import status, viewsets
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework.exceptions import ValidationError
from utils.pagination import StandardPagination
from api.models import RegisteredUser
from qa.models import Answer, AnswerVote, Question, QuestionVote
from qa.serializers import AnswerSerializer, AnswerVoteSerializer, QuestionSerializer, QuestionVoteSerializer


@permission_classes([IsAuthenticatedOrReadOnly])
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.filter(deleted_on__isnull=True).order_by('-created_at')
    serializer_class = QuestionSerializer
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'put', 'delete']

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        post = self.get_object()
        post.view_count += 1
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)


@permission_classes([IsAuthenticatedOrReadOnly])
class QuestionVoteView(APIView):

    @swagger_auto_schema(
        operation_description="Submit a vote on a question.",
        request_body=QuestionVoteSerializer,
        responses={
            201: openapi.Response(description="Vote recorded successfully!"),
            400: openapi.Response(description="Bad request — validation error.")
        }
    )
    def post(self, request, *args, **kwargs):
        post_id = kwargs.get('post_id')
        post = get_object_or_404(Question, pk=post_id)

        serializer = QuestionVoteSerializer(
            data=request.data,
            context={'user': request.user, 'post': post}
        )
        if serializer.is_valid():
            serializer.save()

            vote_type = request.data.get("vote_type")

            if vote_type == 'up':
                post.increment_upvote()
            elif vote_type == 'down':
                post.increment_downvote()

            return Response({"message": "Vote recorded successfully!"}, status=status.HTTP_201_CREATED)

        return Response({"message": "You have already voted on this question!"}, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Check if the authenticated user has voted on a question.",
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
            404: openapi.Response(description="Question not found"),
        }
    )
    def get(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        post_id = kwargs.get('post_id')
        post = get_object_or_404(Question, pk=post_id, deleted_on__isnull=True)

        vote = QuestionVote.objects.filter(user=request.user, post=post, deleted_on__isnull=True).first()

        if vote:
            return Response({
                "user_id": request.user.id,
                "post_id": post.id,
                "vote_type": vote.vote_type,
            }, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        operation_description="Delete a vote on a question.",
        responses={
            204: openapi.Response(description="Vote deleted successfully!"),
            400: openapi.Response(description="Bad request — validation error."),
            404: openapi.Response(description="Vote or question not found."),
        }
    )
    def delete(self, request, *args, **kwargs):
        post_id = kwargs.get('post_id')
        post = get_object_or_404(Question, pk=post_id)

        vote = QuestionVote.objects.filter(user=request.user, post=post, deleted_on__isnull=True).first()

        if not vote:
            return Response({"message": "No vote found to delete for this question."}, status=status.HTTP_404_NOT_FOUND)

        vote.delete()

        vote_type = vote.vote_type

        if vote_type == 'up':
            post.decrement_upvote()
        elif vote_type == 'down':
            post.decrement_downvote()

        return Response({"message": "Vote deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)


@permission_classes([IsAuthenticatedOrReadOnly])
class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Question, id=post_id)
        return post.answers.filter(deleted_on__isnull=True)

    def create(self, request, *args, **kwargs):
        post = get_object_or_404(Question, id=self.kwargs['post_id'])

        if request.user.usertype != RegisteredUser.DIETITIAN:
            return Response({"detail": "Only dietitians can answer questions."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.context['post'] = post

        try:
            serializer.is_valid(raise_exception=True)
            serializer.save(author=request.user, post=post)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            message = str(e.detail)

            if "deleted" in message.lower():
                return Response({"detail": e.detail}, status=status.HTTP_404_NOT_FOUND)
            if "non-commentable" in message.lower():
                return Response({"detail": e.detail}, status=status.HTTP_403_FORBIDDEN)
            if "different question" in message.lower():
                return Response({"detail": e.detail}, status=status.HTTP_409_CONFLICT)
            return Response({"detail": e.detail}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Question, id=post_id)

        if post.deleted_on:
            return Response({"detail": "Question is deleted."}, status=status.HTTP_404_NOT_FOUND)
        if not post.is_commentable:
            return Response({"detail": "Answers are disabled for this question."}, status=status.HTTP_403_FORBIDDEN)

        comments = post.answers.filter(deleted_on__isnull=True)
        page = self.paginate_queryset(comments)
        serializer = self.get_serializer(page if page is not None else comments, many=True)

        return self.get_paginated_response(serializer.data) if page else Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        post_id = self.kwargs.get('post_id')
        comment_id = self.kwargs.get('comment_id')

        post = get_object_or_404(Question, id=post_id)
        if post.deleted_on:
            return Response({"detail": "Question is deleted."}, status=status.HTTP_404_NOT_FOUND)
        if not post.is_commentable:
            return Response({"detail": "Answers are disabled for this question."}, status=status.HTTP_403_FORBIDDEN)

        comment = get_object_or_404(post.answers.filter(deleted_on__isnull=True), id=comment_id)

        serializer = self.get_serializer(comment)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        comment = get_object_or_404(self.get_queryset(), id=self.kwargs['comment_id'])

        if comment.author != request.user:
            return Response({"detail": "You cannot delete an answer you did not create."}, status=status.HTTP_403_FORBIDDEN)

        comment.deleted_on = now()
        comment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@permission_classes([IsAuthenticatedOrReadOnly])
class AnswerVoteView(APIView):

    @swagger_auto_schema(
        operation_description="Submit a vote on an answer.",
        request_body=AnswerVoteSerializer,
        responses={
            201: openapi.Response(description="Vote recorded successfully!"),
            400: openapi.Response(description="Bad request — validation error.")
        }
    )
    def post(self, request, *args, **kwargs):
        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(Answer, pk=comment_id)

        serializer = AnswerVoteSerializer(
            data=request.data,
            context={'user': request.user, 'comment': comment}
        )
        if serializer.is_valid():
            serializer.save()

            vote_type = request.data.get("vote_type")

            if vote_type == 'up':
                comment.increment_upvote()
            elif vote_type == 'down':
                comment.increment_downvote()

            return Response({"message": "Vote recorded successfully!"}, status=status.HTTP_201_CREATED)

        return Response({"message": "You have already voted on this answer!"}, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Check if the authenticated user has voted on an answer.",
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
            404: openapi.Response(description="Answer not found"),
        }
    )
    def get(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(Answer, pk=comment_id, deleted_on__isnull=True)

        vote = AnswerVote.objects.filter(user=request.user, comment=comment, deleted_on__isnull=True).first()

        if vote:
            return Response({
                "user_id": request.user.id,
                "comment_id": comment.id,
                "vote_type": vote.vote_type,
            }, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        operation_description="Delete a vote on an answer.",
        responses={
            204: openapi.Response(description="Vote deleted successfully!"),
            400: openapi.Response(description="Bad request — validation error."),
            404: openapi.Response(description="Vote or answer not found."),
        }
    )
    def delete(self, request, *args, **kwargs):
        comment_id = kwargs.get('comment_id')
        comment = get_object_or_404(Answer, pk=comment_id)

        vote = AnswerVote.objects.filter(user=request.user, comment=comment, deleted_on__isnull=True).first()

        if not vote:
            return Response({"message": "No vote found to delete for this answer."}, status=status.HTTP_404_NOT_FOUND)

        vote.delete()

        vote_type = vote.vote_type

        if vote_type == 'up':
            comment.decrement_upvote()
        elif vote_type == 'down':
            comment.decrement_downvote()

        return Response({"message": "Vote deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)
