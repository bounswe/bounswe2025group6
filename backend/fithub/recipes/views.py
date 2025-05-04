# recipes/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import RecipeSerializer
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated

@swagger_auto_schema(
    method='post',
    operation_description="Create a new recipe.",
    request_body=RecipeSerializer,
    responses={
        status.HTTP_201_CREATED: RecipeSerializer,
        status.HTTP_400_BAD_REQUEST: 'Invalid data',
    }
)
@api_view(['POST'])
def create_recipe(request):
    permission_classes = [IsAuthenticated]

    # Set the creator to the logged-in user
    data = request.data
    data['creator'] = request.user.id  # Automatically assign the creator based on the logged-in user

    serializer = RecipeSerializer(data=data)
    if serializer.is_valid():
        serializer.save() # Save the recipe
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
