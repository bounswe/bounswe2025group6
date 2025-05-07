# forum/serializers.py
from rest_framework import serializers
from forum.models import ForumPost
from utils.models import Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['name']

class ForumPostSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True
    )

    class Meta:
        model = ForumPost
        fields = [
            'id', 'title',
            'content', 'is_commentable',
            'author',
            'view_count', 'like_count',
            'tags', 'tag_names',
            'created_at', 'updated_at', 'deleted_on'
        ]
        read_only_fields = ['author', 'view_count', 'like_count', 'created_at', 'updated_at', 'deleted_on']

    def validate_tag_names(self, value):
        """Validate that all tag names are valid choices."""
        valid_tag_names = [choice.value for choice in Tag.TagChoices]
        invalid_tags = [name for name in value if name not in valid_tag_names]

        if invalid_tags:
            raise serializers.ValidationError(
                f"Invalid tag names: {', '.join(invalid_tags)}. "
                f"Valid tags are: {', '.join(valid_tag_names)}."
            )
        return value
    
    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        user = self.context['request'].user

        post = ForumPost.objects.create(author=user, **validated_data)

        # Assign tags based on tag names
        tags = Tag.objects.filter(name__in=tag_names)
        post.tags.set(tags)
        return post
