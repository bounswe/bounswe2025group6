# forum/serializers.py
from random import choice
from rest_framework import serializers
from forum.models import ForumPost

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

    def validate_tags(self, value):
        """Validate that all tag names are valid choices."""
        valid_tag_names = [choice.value.lower() for choice in ForumPost.TagChoices]  # Convert to lowercase
        invalid_tags = [name.lower() for name in value if name.lower() not in valid_tag_names]

        if invalid_tags:
            raise serializers.ValidationError(
                f"Invalid tag names: {', '.join(invalid_tags)}. "
                f"Valid tags are: {', '.join(valid_tag_names)}."
            )
        return value

    def create(self, validated_data):
        tag_names = validated_data.pop('tags', [])
        user = self.context['request'].user
        post = ForumPost.objects.create(author=user, **validated_data)

        # Normalize and validate tag names
        normalized_tag_names = [tag_name.strip().capitalize() for tag_name in tag_names]

        # Assign tags directly as a list of strings (no need for ForumTag model)
        post.tags = normalized_tag_names
        post.save()

        return post