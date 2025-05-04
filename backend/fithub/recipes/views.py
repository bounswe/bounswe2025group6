# recipes/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import RecipeSerializer
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from .serializers import RecipePagination
from .models import Recipe
from drf_yasg import openapi

# Created for swagger documentation, paginate get request
pagination_params = [
    openapi.Parameter('page', openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
    openapi.Parameter('page_size', openapi.IN_QUERY, description="Number of items per page", type=openapi.TYPE_INTEGER),
]

# Create a new recipe, get a list of all recipes
@swagger_auto_schema( # swagger decorator for get request
    method='get',
    operation_description="Retrieve a paginated list of recipes.",
    responses={200: RecipeSerializer(many=True)},
    manual_parameters=pagination_params
)
@swagger_auto_schema( # swagger decorator for post request
    method='post',
    operation_description="Create a new recipe.",
    request_body=RecipeSerializer,
    responses={201: RecipeSerializer, 400: 'Bad Request'}
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated]) # check if user is authenticated
def recipes_view(request):
    if request.method == 'GET':
        recipes = Recipe.objects.all().order_by('id')
        paginator = RecipePagination()
        result_page = paginator.paginate_queryset(recipes, request)
        serializer = RecipeSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['creator'] = request.user.id
        serializer = RecipeSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Get details of a specific recipe by ID
@swagger_auto_schema(
    method='get',
    operation_description="Get a specific recipe by ID.",
    responses={
        status.HTTP_200_OK: RecipeSerializer,
        status.HTTP_404_NOT_FOUND: 'Recipe not found',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated]) # check if user is authenticated
def recipe_detail(request, id):
    try:
        recipe = Recipe.objects.get(id=id)
    except Recipe.DoesNotExist:
        return Response({'detail': 'Recipe not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = RecipeSerializer(recipe)
    return Response(serializer.data, status=status.HTTP_200_OK)