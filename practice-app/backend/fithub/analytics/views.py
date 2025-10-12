from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import get_user_model
from recipes.models import Recipe
from ingredients.models import Ingredient
from forum.models import ForumPost, ForumPostComment
from .serializers import AnalyticsSerializer
from rest_framework.decorators import permission_classes

User = get_user_model()

@permission_classes([IsAuthenticatedOrReadOnly])
class AnalyticsView(APIView):
    """
    GET /analytics
    Returns anonymized system-level statistics.
    """

    @swagger_auto_schema(
        operation_description="Get aggregated counts of users, recipes, ingredients, posts, and comments.",
        responses={
            200: openapi.Response(
                description="Aggregated system statistics",
                schema=AnalyticsSerializer
            )
        }
    )
    def get(self, request):
        data = {
            "users_count": User.objects.count(),
            "recipes_count": Recipe.objects.count(),
            "ingredients_count": Ingredient.objects.count(),
            "posts_count": ForumPost.objects.count(),
            "comments_count": ForumPostComment.objects.count(),
        }

        serializer = AnalyticsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
