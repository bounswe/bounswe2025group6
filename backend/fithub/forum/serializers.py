# forum/serializers.py
from rest_framework import serializers
from forum.models import ForumPost
from utils.models import Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class ForumPostSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        source='tags'
    )

    class Meta:
        model = ForumPost
        fields = [
            'id', 'author', 'title', 'content',
            'is_commentable', 'view_count', 'like_count',
            'tags', 'tag_ids', 'created_at', 'updated_at'
        ]
