# forum/serializers.py
from random import choice
from django.forms import ValidationError
from rest_framework import serializers
from utils.models import CommentReport, CommentVote
from forum.models import ForumPost, ForumPostComment, ForumPostCommentVote
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


# Serializer for ForumPostComment
class ForumPostCommentSerializer(serializers.ModelSerializer):
    queryset = ForumPostComment.objects.filter(deleted_on__isnull=True)

    class Meta:
        model = ForumPostComment
        fields = ['id', 'content', 'author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']
        read_only_fields = ['author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']

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

    def create(self, validated_data):
        user = self.context['user']
        comment = self.context['comment']

        # Duplicate check here instead of validate()
        if ForumPostCommentVote.objects.filter(user=user, comment=comment).exists():
            raise serializers.ValidationError("You have already voted on this comment.")

        return ForumPostCommentVote.objects.create(user=user, comment=comment, **validated_data)