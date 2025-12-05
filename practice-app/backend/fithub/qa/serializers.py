from random import choice
import re
from rest_framework import serializers
from utils.models import CommentVoteModel, PostVoteModel
from qa.models import Answer, AnswerVote, Question, QuestionVote


class QuestionSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField())

    class Meta:
        model = Question
        fields = [
            'id', 'title', 'content', 'is_commentable',
            'author', 'view_count', 'upvote_count', 'downvote_count',
            'tags', 'created_at', 'updated_at', 'deleted_on'
        ]
        read_only_fields = ['author', 'view_count', 'upvote_count', 'downvote_count', 'created_at', 'updated_at', 'deleted_on']

    def normalize_tag(self, tag_name):
        """Normalize tag names by removing extra spaces and capitalizing."""
        return re.sub(r'\s+', ' ', tag_name.strip().lower()).title()

    def validate_tags(self, value):
        normalized_tags = [self.normalize_tag(tag) for tag in value]
        valid_tags = [choice.value for choice in Question.TagChoices]

        invalid_tags = [tag for tag in normalized_tags if tag not in valid_tags]
        if invalid_tags:
            raise serializers.ValidationError(
                f"Invalid tag names: {', '.join(invalid_tags)}. "
                f"Valid tags are: {', '.join(valid_tags)}."
            )
        return normalized_tags

    def create(self, validated_data):
        tags = validated_data.pop('tags')
        user = self.context['request'].user
        post = Question.objects.create(author=user, **validated_data)
        post.tags = tags
        post.save()
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        if tags is not None:
            instance.tags = tags
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class QuestionVoteSerializer(serializers.ModelSerializer):
    vote_type = serializers.ChoiceField(choices=PostVoteModel.VOTE_CHOICES)

    class Meta:
        model = QuestionVote
        fields = ['user', 'post', 'vote_type']
        read_only_fields = ['user', 'post']

    def validate(self, attrs):
        user = self.context['user']
        post = self.context['post']

        if QuestionVote.objects.filter(
            user=user,
            post=post,
            deleted_on__isnull=True
        ).exists():
            raise serializers.ValidationError({
                'vote_type': "You have already voted on this question."
            })

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['user']
        validated_data['post'] = self.context['post']
        return QuestionVote.objects.create(**validated_data)


class AnswerSerializer(serializers.ModelSerializer):
    queryset = Answer.objects.filter(deleted_on__isnull=True)

    class Meta:
        model = Answer
        fields = ['id', 'content', 'author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']
        read_only_fields = ['author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']

    def validate(self, data):
        post = self.context.get('post')
        parent_comment = data.get('parent_comment')

        if post is None:
            raise serializers.ValidationError("Question is not found.")
        if post.deleted_on:
            raise serializers.ValidationError("Cannot answer a deleted question.")
        if not post.is_commentable:
            raise serializers.ValidationError("Cannot answer a non-commentable question.")
        if parent_comment and parent_comment.post != post:
            raise serializers.ValidationError("Cannot reply to an answer from a different question.")
        return data

    def create(self, validated_data):
        validated_data['upvote_count'] = 0
        validated_data['downvote_count'] = 0
        validated_data['reported_count'] = 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('upvote_count', None)
        validated_data.pop('downvote_count', None)
        validated_data.pop('reported_count', None)
        return super().update(instance, validated_data)


class AnswerVoteSerializer(serializers.ModelSerializer):
    vote_type = serializers.ChoiceField(choices=CommentVoteModel.VOTE_CHOICES)

    class Meta:
        model = AnswerVote
        fields = ['user', 'comment', 'vote_type']
        read_only_fields = ['user', 'comment']

    def validate(self, attrs):
        user = self.context['user']
        comment = self.context['comment']

        if AnswerVote.objects.filter(
            user=user,
            comment=comment,
            deleted_on__isnull=True
        ).exists():
            raise serializers.ValidationError({
                'vote_type': "You have already voted on this answer."
            })

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['user']
        validated_data['comment'] = self.context['comment']
        return AnswerVote.objects.create(**validated_data)