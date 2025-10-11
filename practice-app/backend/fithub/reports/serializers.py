# reports/serializers.py
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Report

from forum.models import ForumPost as Post
from recipes.models import Recipe


class ReportCreateSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField(write_only=True)
    object_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Report
        fields = ['content_type', 'object_id', 'report_type', 'description']
    
    def create(self, validated_data):
        content_type_name = validated_data.pop('content_type')
        object_id = validated_data.pop('object_id')
        
        content_type_map = {
            'post': ContentType.objects.get_for_model(Post),
            'recipe': ContentType.objects.get_for_model(Recipe),
        }
        
        content_type = content_type_map.get(content_type_name.lower())
        if not content_type:
            available_types = list(content_type_map.keys())
            raise serializers.ValidationError(
                f"Invalid content type '{content_type_name}'. Available types: {available_types}"
            )
        
        # Verify the object exists
        model_class = content_type.model_class()
        try:
            content_object = model_class.objects.get(id=object_id)
        except model_class.DoesNotExist:
            raise serializers.ValidationError("The reported content does not exist")
        
        # Get the reporter from the context
        reporter = self.context['request'].user
        
        # Create the report
        return Report.objects.create(
            content_type=content_type,
            object_id=object_id,
            reporter=reporter, 
            **validated_data
        )

class ReportSerializer(serializers.ModelSerializer):
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    content_object_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('created_at',)
    
    def get_content_object_preview(self, obj):
        return str(obj.content_object)