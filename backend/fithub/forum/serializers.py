# forum/serializers.py
from random import choice
from django.forms import ValidationError
from rest_framework import serializers
from utils.models import CommentVote
from forum.models import ForumPost, ForumPostVote, ForumPostComment, ForumPostCommentVote
import re

# Serializer for ForumPost
class ForumPostSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField())

    class Meta:
        model = ForumPost
        fields = [
            'id', 'title', 'content', 'is_commentable',
            'author', 'view_count', 'like_count',
            'tags', 'created_at', 'updated_at', 'deleted_on'
        ]
        read_only_fields = ['author', 'view_count', 'like_count', 'created_at', 'updated_at', 'deleted_on']

    def normalize_tag(self, tag_name):
        """Normalize tag names by removing extra spaces and capitalizing."""
        # no   waste -> No Waste
        # no waste -> No Waste
        # No Waste -> No Waste
        # Remove extra spaces and capitalize
        return re.sub(r'\s+', ' ', tag_name.strip().lower()).title()

    def validate_tags(self, value):
        """Validate that all tag names are valid choices."""
        normalized_tags = [self.normalize_tag(tag) for tag in value]
        valid_tags = [choice.value for choice in ForumPost.TagChoices]

        invalid_tags = [tag for tag in normalized_tags if tag not in valid_tags]
        if invalid_tags:
            raise serializers.ValidationError(
                f"Invalid tag names: {', '.join(invalid_tags)}. "
                f"Valid tags are: {', '.join(valid_tags)}."
            )
        return normalized_tags

    def create(self, validated_data):
        tags = validated_data.pop('tags')  # already validated & normalized
        user = self.context['request'].user
        post = ForumPost.objects.create(author=user, **validated_data)
        post.tags = tags
        post.save()
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)  # optional in PUT hence can be None
        if tags is not None:
            instance.tags = tags  # already validated & normalized
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# Serializer for ForumPostVote
class ForumPostVoteSerializer(serializers.ModelSerializer):
    vote_type = serializers.ChoiceField(choices=CommentVote.VOTE_CHOICES)
    class Meta:
        model = ForumPostVote
        fields = ['user', 'post', 'vote_type']
        read_only_fields = ['user', 'post']

    # Enforce that the user and post are unique together (soft delete checked one can delete and re-vote)
    def validate(self, attrs):
        user = self.context['user']
        post = self.context['post']

        if ForumPostVote.objects.filter(
            user=user,
            post=post,
            deleted_on__isnull=True
        ).exists():
            raise serializers.ValidationError({
                'vote_type': "You have already voted on this post."
            })

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['user']
        validated_data['post'] = self.context['post']
        return ForumPostVote.objects.create(**validated_data)


### SERIALIZERS FOR COMMENTS ###

# Serializer for ForumPostComment
class ForumPostCommentSerializer(serializers.ModelSerializer):
    queryset = ForumPostComment.objects.filter(deleted_on__isnull=True)

    class Meta:
        model = ForumPostComment
        fields = ['id', 'content', 'author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']
        read_only_fields = ['author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']

    def validate(self, data):
        post = self.context.get('post')
        parent_comment = data.get('parent_comment')

        if post is None:
            raise serializers.ValidationError("Post is not found.")
        if post.deleted_on:
            raise serializers.ValidationError("Cannot comment on a deleted post.")
        if not post.is_commentable:
            raise serializers.ValidationError("Cannot comment on a non-commentable post.")
        if parent_comment and parent_comment.post != post:
            raise serializers.ValidationError("Cannot reply to a comment from a different post.")
        return data

    def create(self, validated_data):
        # Initialize the comment with zero counts for upvotes, downvotes, and reports
        validated_data['upvote_count'] = 0
        validated_data['downvote_count'] = 0
        validated_data['reported_count'] = 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Ensure that upvote_count, downvote_count, and reported_count cannot be updated
        validated_data.pop('upvote_count', None)
        validated_data.pop('downvote_count', None)
        validated_data.pop('reported_count', None)

        return super().update(instance, validated_data)

# Serializer for ForumPostCommentVote
class ForumPostCommentVoteSerializer(serializers.ModelSerializer):
    vote_type = serializers.ChoiceField(choices=CommentVote.VOTE_CHOICES)
    class Meta:
        model = ForumPostCommentVote
        fields = ['user', 'comment', 'vote_type']
        read_only_fields = ['user', 'comment']

    # Enforce that the user and comment are unique together (soft delete checked one can delete and re-vote)
    def validate(self, attrs):
        user = self.context['user']
        comment = self.context['comment']

        if ForumPostCommentVote.objects.filter(
            user=user,
            comment=comment,
            deleted_on__isnull=True
        ).exists():
            raise serializers.ValidationError({
                'vote_type': "You have already voted on this comment."
            })

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['user']
        validated_data['comment'] = self.context['comment']
        return ForumPostCommentVote.objects.create(**validated_data)