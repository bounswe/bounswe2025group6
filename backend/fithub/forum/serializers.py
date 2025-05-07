# forum/serializers.py
from random import choice
from django.forms import ValidationError
from rest_framework import serializers
from forum.models import ForumPost, ForumPostComment
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
        return re.sub(r'\s+', ' ', tag_name).strip().title()

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
    author = serializers.StringRelatedField(read_only=True)  # This will show the author's username or any string representation of the user
    queryset = ForumPostComment.objects.filter(deleted_on__isnull=True)

    # Set the lookup_field to post_id to align with the URL pattern
    lookup_field = 'post_id'  # Set this to match the URL keyword argument

    class Meta:
        model = ForumPostComment
        fields = ['id', 'content', 'author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at']
        read_only_fields = ['author', 'upvote_count', 'downvote_count', 'reported_count', 'created_at', 'updated_at', 'deleted_on']

    # Make sure the URL passes post_id (not pk)
    def get_queryset(self):
        # Get the post_id from URL kwargs
        post_id = self.kwargs.get('post_id')
        if not post_id:
            raise ValidationError("Post ID not provided.")

        # Return comments for the specified post
        return ForumPostComment.objects.filter(post_id=post_id)

    def perform_create(self, serializer):
        # Use the post_id from URL kwargs to get the associated ForumPost
        post = ForumPost.objects.get(id=self.kwargs['post_id'])

        if not post.is_commentable:
            raise ValidationError("Cannot comment on a non-commentable post.")

        # Create the comment associated with the post and user
        serializer.save(author=self.request.user, post=post)

    def create(self, validated_data):
        # Initialize the comment with zero counts for upvotes, downvotes, and reports
        validated_data['upvote_count'] = 0
        validated_data['downvote_count'] = 0
        validated_data['reported_count'] = 0
        return super().create(validated_data)

    def save(self, *args, **kwargs):
        # Access the post from context instead of directly through `self`
        post = self.context['view'].get_object()

        # Check if the post is commentable before saving the comment
        if not post.is_commentable:
            raise ValueError("Cannot comment on a non-commentable post")

        super().save(*args, **kwargs)

    def update(self, instance, validated_data):
        # Ensure that upvote_count, downvote_count, and reported_count cannot be updated
        validated_data.pop('upvote_count', None)
        validated_data.pop('downvote_count', None)
        validated_data.pop('reported_count', None)

        return super().update(instance, validated_data)
