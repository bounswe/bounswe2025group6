from rest_framework import serializers

class AnalyticsSerializer(serializers.Serializer):
    users_count = serializers.IntegerField()
    recipes_count = serializers.IntegerField()
    ingredients_count = serializers.IntegerField()
    posts_count = serializers.IntegerField()
    comments_count = serializers.IntegerField()
