# recipes/views.py

from django.db import models
from rest_framework.decorators import permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import RecipeCreateSerializer, RecipeUpdateSerializer
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from .models import Recipe
from drf_yasg import openapi
from rest_framework import viewsets
from .serializers import RecipeListSerializer, RecipeDetailSerializer
from django.utils import timezone
from .models import RecipeIngredient
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Ingredient
from rest_framework.decorators import api_view
from decimal import Decimal, InvalidOperation
from django.db.models import F, ExpressionWrapper, IntegerField
from django.db.models import Count, Q, Exists, OuterRef


# Created for swagger documentation, paginate get request
pagination_params = [
    openapi.Parameter('page', openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
    openapi.Parameter('page_size', openapi.IN_QUERY, description="Number of items per page", type=openapi.TYPE_INTEGER),
]

# Used for pagination (Get endpoint)
class RecipePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'page': self.page.number,
            'page_size': self.page.paginator.per_page,
            'total': self.page.paginator.count,
            'results': data
        })

class RecipeViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    queryset = Recipe.objects.filter(deleted_on=None)  # Filter out soft-deleted recipes
    http_method_names = ['get', 'post', 'put', 'delete'] # We don't need PATCH method (PUT can also be used for partial updates)

    def get_permissions(self):
        """
        Allow public access to list and retrieve (viewing recipes).
        Require authentication for create, update, delete (modifying recipes).
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    # Use the correct serializer class based on the action type
    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        elif self.action == 'retrieve':
            return RecipeDetailSerializer
        elif self.action == 'create': # For create, update, and destroy actions
            return RecipeCreateSerializer
        elif self.action == 'update':
            return RecipeUpdateSerializer
        else:
            return RecipeDetailSerializer  # Default to detail serializer

    # Use the custom pagination class
    pagination_class = RecipePagination

    @swagger_auto_schema(
        operation_description="Create a new recipe",
        request_body=RecipeCreateSerializer,  # Use the correct serializer for the POST request
        responses={201: RecipeDetailSerializer},
    )
    def create(self, request, *args, **kwargs):
        """
        Create a new recipe with ingredients (Post endpoint)
        """
        # Ensure the user is authenticated
        if not request.user.is_authenticated:
            return Response({"error": "Authentication is required."}, status=status.HTTP_401_UNAUTHORIZED)

        # Add the creator (user) to the validated data
        data = request.data.copy()
        data['creator'] = request.user.id  # Add the authenticated user's ID as the creator

        # Pass the updated data to the serializer
        serializer = self.get_serializer(data=data)

        if serializer.is_valid():
            # Create the recipe with ingredients
            recipe = serializer.save()

            # Use RecipeDetailSerializer for the created recipe response
            # Pass request context so currency conversion works correctly
            detailed_serializer = RecipeDetailSerializer(recipe, context={'request': request})
            return Response(detailed_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """
        Custom list view to handle paginated response (Get list endpoint)
        """
        page = self.paginate_queryset(self.get_queryset())
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # If no pagination required
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve detailed view of a single recipe (Get detailed endpoint)
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Update an existing recipe",
        request_body=RecipeUpdateSerializer,  # Use the correct serializer for the POST request
        responses={200: RecipeDetailSerializer},
    )
    def update(self, request, *args, **kwargs):
        """
        Update an existing recipe (Put endpoint)
        """
        instance = self.get_object()

        # Ensure the creator cannot be updated (it's tied to the user)
        data = request.data.copy()
        data['creator'] = instance.creator.id  # Re-assign the current creator ID

        # Pass the updated data to the serializer
        serializer = self.get_serializer(instance, data=data, partial=True)

        if serializer.is_valid():
            # Save the updated instance and return the response
            updated_recipe = serializer.save()
            # Pass request context so currency conversion works correctly
            detailed_serializer = RecipeDetailSerializer(updated_recipe, context={'request': request})
            return Response(detailed_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a recipe (Delete endpoint)
        """

        instance = self.get_object()

        # Object is already deleted before
        # We don't expect to be here, we use query set to filter out deleted recipes
        if instance.deleted_on:
            return Response({"detail": "Recipe not found."}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete related ingredients
        RecipeIngredient.objects.filter(recipe=instance, deleted_on__isnull=True).update(deleted_on=timezone.now())

        # Soft delete the recipe
        instance.deleted_on = timezone.now()
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # Meal planner endpoint
    @swagger_auto_schema(
        operation_description="Filter recipes based on optional meal planner criteria",
        manual_parameters=[
            
            openapi.Parameter('name', openapi.IN_QUERY, description="Recipe name to search for", type=openapi.TYPE_STRING),
            openapi.Parameter('meal_type', openapi.IN_QUERY, description="Meal type (breakfast/lunch/dinner)", type=openapi.TYPE_STRING, enum=['breakfast', 'lunch', 'dinner']),

            openapi.Parameter('min_cost_per_serving', openapi.IN_QUERY, description="Minimum cost per serving", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_cost_per_serving', openapi.IN_QUERY, description="Maximum cost per serving", type=openapi.TYPE_NUMBER),

            openapi.Parameter('min_difficulty_rating', openapi.IN_QUERY, description="Minimum difficulty rating", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_difficulty_rating', openapi.IN_QUERY, description="Maximum difficulty rating", type=openapi.TYPE_NUMBER),
            openapi.Parameter('min_taste_rating', openapi.IN_QUERY, description="Minimum taste rating", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_taste_rating', openapi.IN_QUERY, description="Maximum taste rating", type=openapi.TYPE_NUMBER),
            openapi.Parameter('min_health_rating', openapi.IN_QUERY, description="Minimum health rating", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_health_rating', openapi.IN_QUERY, description="Maximum health rating", type=openapi.TYPE_NUMBER),
            openapi.Parameter('min_like_count', openapi.IN_QUERY, description="Minimum like count", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_like_count', openapi.IN_QUERY, description="Maximum like count", type=openapi.TYPE_NUMBER),

            openapi.Parameter('min_calories', openapi.IN_QUERY, description="Minimum calories", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_calories', openapi.IN_QUERY, description="Maximum calories", type=openapi.TYPE_NUMBER),
            openapi.Parameter('min_carbs', openapi.IN_QUERY, description="Minimum carbs", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_carbs', openapi.IN_QUERY, description="Maximum carbs", type=openapi.TYPE_NUMBER),
            openapi.Parameter('min_fat', openapi.IN_QUERY, description="Minimum fat", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_fat', openapi.IN_QUERY, description="Maximum fat", type=openapi.TYPE_NUMBER),
            openapi.Parameter('min_protein', openapi.IN_QUERY, description="Minimum protein", type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_protein', openapi.IN_QUERY, description="Maximum protein", type=openapi.TYPE_NUMBER),
            
            openapi.Parameter('min_prep_time', openapi.IN_QUERY, description="Minimum preparation time (minutes)", type=openapi.TYPE_INTEGER),
            openapi.Parameter('max_prep_time', openapi.IN_QUERY, description="Maximum preparation time (minutes)", type=openapi.TYPE_INTEGER),
            openapi.Parameter('min_cook_time', openapi.IN_QUERY, description="Minimum cooking time (minutes)", type=openapi.TYPE_INTEGER),
            openapi.Parameter('max_cook_time', openapi.IN_QUERY, description="Maximum cooking time (minutes)", type=openapi.TYPE_INTEGER),
            openapi.Parameter('min_total_time', openapi.IN_QUERY, description="Minimum total prep + cook time (minutes)", type=openapi.TYPE_INTEGER),
            openapi.Parameter('max_total_time', openapi.IN_QUERY, description="Maximum total prep + cook time (minutes)", type=openapi.TYPE_INTEGER),

            openapi.Parameter('has_image', openapi.IN_QUERY, description="Filter recipes that have an image", type=openapi.TYPE_BOOLEAN),
            openapi.Parameter('is_approved', openapi.IN_QUERY, description="Filter only approved recipes", type=openapi.TYPE_BOOLEAN),
            openapi.Parameter('is_featured', openapi.IN_QUERY, description="Filter only featured recipes", type=openapi.TYPE_BOOLEAN),
            openapi.Parameter('exclude_allergens', openapi.IN_QUERY, description="Comma-separated list of allergens to exclude (e.g., 'nuts,gluten')", type=openapi.TYPE_STRING),
            openapi.Parameter('diet_info', openapi.IN_QUERY, description="Comma-separated list of diet info (e.g., 'vegetarian, healthy-fat')", type=openapi.TYPE_STRING),
            *pagination_params,  # include page & page_size
        ],
        responses={200: RecipeListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="meal_planner", permission_classes=[IsAuthenticated])
    def meal_planner(self, request):
        """
        Returns a list of recipes filtered by meal planner criteria (GET /recipes/meal_planner/)
        All query parameters are optional.
        """
        queryset = self.get_queryset()

        # Extract filters from query params
        name = request.query_params.get("name")
        
        meal_type = request.query_params.get("meal_type")

        min_cost_per_serving = request.query_params.get("min_cost_per_serving")
        max_cost_per_serving = request.query_params.get("max_cost_per_serving")

        min_difficulty_rating = request.query_params.get("min_difficulty_rating")
        max_difficulty_rating = request.query_params.get("max_difficulty_rating")
        min_taste_rating = request.query_params.get("min_taste_rating")
        max_taste_rating = request.query_params.get("max_taste_rating")
        min_health_rating = request.query_params.get("min_health_rating")
        max_health_rating = request.query_params.get("max_health_rating")
        min_like_count = request.query_params.get("min_like_count")
        max_like_count = request.query_params.get("max_like_count")

        # Convert nutrition query parameters to Decimal
        min_calories = request.query_params.get("min_calories")
        max_calories = request.query_params.get("max_calories")
        min_carbs = request.query_params.get("min_carbs")
        max_carbs = request.query_params.get("max_carbs")
        min_fat = request.query_params.get("min_fat")
        max_fat = request.query_params.get("max_fat")
        min_protein = request.query_params.get("min_protein")
        max_protein = request.query_params.get("max_protein")
        
        # Helper function to convert to Decimal
        def to_decimal(value):
            if value is None:
                return None
            try:
                return Decimal(str(value))
            except (InvalidOperation, ValueError):
                return None
        
        min_calories = to_decimal(min_calories)
        max_calories = to_decimal(max_calories)
        min_carbs = to_decimal(min_carbs)
        max_carbs = to_decimal(max_carbs)
        min_fat = to_decimal(min_fat)
        max_fat = to_decimal(max_fat)
        min_protein = to_decimal(min_protein)
        max_protein = to_decimal(max_protein)

        min_prep_time = request.query_params.get("min_prep_time")
        max_prep_time = request.query_params.get("max_prep_time")
        min_cook_time = request.query_params.get("min_cook_time")
        max_cook_time = request.query_params.get("max_cook_time")
        min_total_time = request.query_params.get("min_total_time")
        max_total_time = request.query_params.get("max_total_time")
        
        has_image = request.query_params.get("has_image")
        is_approved = request.query_params.get("is_approved")
        is_featured = request.query_params.get("is_featured")
        exclude_allergens = request.query_params.get("exclude_allergens")

        diet_info = request.query_params.get("diet_info")

        # Apply filters dynamically
        filters = Q()

        if name:
            filters &= Q(name__icontains=name)
            
        if meal_type:
            valid_meal_types = [choice[0] for choice in Recipe.MEAL_TYPES]
            if meal_type not in valid_meal_types:
                return Response(
                    {
                        "error": f"Invalid meal_type '{meal_type}'. "
                                f"Must be one of: {', '.join(valid_meal_types)}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            filters &= Q(meal_type=meal_type)
        
        if min_cost_per_serving or max_cost_per_serving:
            # Query params are supplied in the requesting user's preferred currency.
            # Convert them to canonical DB currency (USD) before filtering.
            def _to_usd(value):
                val = to_decimal(value)
                if val is None:
                    return None
                user_currency = getattr(request.user, 'preferredCurrency', 'USD')
                # Use same default rate as Ingredient.get_price_for_user
                usd_to_try_rate = Decimal('40.0')
                if user_currency == 'TRY':
                    # convert TRY to USD
                    return (val / usd_to_try_rate).quantize(Decimal('0.01'))
                return val

            if min_cost_per_serving:
                min_val_usd = _to_usd(min_cost_per_serving)
                if min_val_usd is not None:
                    filters &= Q(cost_per_serving__gte=min_val_usd)
            if max_cost_per_serving:
                max_val_usd = _to_usd(max_cost_per_serving)
                if max_val_usd is not None:
                    filters &= Q(cost_per_serving__lte=max_val_usd)
        
        if min_difficulty_rating:
            filters &= Q(difficulty_rating__gte=min_difficulty_rating)
        if max_difficulty_rating:
            filters &= Q(difficulty_rating__lte=max_difficulty_rating)
        if min_taste_rating:
            filters &= Q(taste_rating__gte=min_taste_rating)
        if max_taste_rating:
            filters &= Q(taste_rating__lte=max_taste_rating)
        if min_health_rating:
            filters &= Q(health_rating__gte=min_health_rating)
        if max_health_rating:
            filters &= Q(health_rating__lte=max_health_rating)
        if min_like_count:
            filters &= Q(like_count__gte=min_like_count)
        if max_like_count:
            filters &= Q(like_count__lte=max_like_count)
        
        if min_calories:
            filters &= Q(calories__gte=min_calories)
        if max_calories:
            filters &= Q(calories__lte=max_calories)
        if min_carbs:
            filters &= Q(carbs__gte=min_carbs)
        if max_carbs:
            filters &= Q(carbs__lte=max_carbs)
        if min_fat:
            filters &= Q(fat__gte=min_fat)
        if max_fat:
            filters &= Q(fat__lte=max_fat)
        if min_protein:
            filters &= Q(protein__gte=min_protein)
        if max_protein:
            filters &= Q(protein__lte=max_protein)


        if min_prep_time:
            filters &= Q(prep_time__gte=min_prep_time)
        if max_prep_time:
            filters &= Q(prep_time__lte=max_prep_time)
        if min_cook_time:
            filters &= Q(cook_time__gte=min_cook_time)
        if max_cook_time:
            filters &= Q(cook_time__lte=max_cook_time)
        if min_total_time:
            queryset = queryset.annotate(
                total_time_expr=ExpressionWrapper(F('prep_time') + F('cook_time'), output_field=IntegerField())
            ).filter(total_time_expr__gte=min_total_time)
        if max_total_time:
            queryset = queryset.annotate(
                total_time_expr=ExpressionWrapper(F('prep_time') + F('cook_time'), output_field=IntegerField())
            ).filter(total_time_expr__lte=max_total_time)
            
        if has_image is not None:
            if has_image.lower() == "true":
                filters &= Q(image__isnull=False) & ~Q(image='')
            else:
                filters &= Q(Q(image__isnull=True) | Q(image=''))
        if is_approved is not None:
            filters &= Q(is_approved=(is_approved.lower() == "true"))
        if is_featured is not None:
            filters &= Q(is_featured=(is_featured.lower() == "true"))

        from django.db.models import Exists, OuterRef

        if diet_info:
            diet_info_list = [
                info.strip().lower()
                for info in diet_info.split(',')
                if info.strip()
            ]

            STRICT_TAGS = {"vegan", "gluten-free"}

            queryset = queryset.filter(
                recipe_ingredients__deleted_on__isnull=True
            )


            # all recipe ingredient must have tags
            for tag in diet_info_list:
                if tag in STRICT_TAGS:
                    bad_ingredient_qs = RecipeIngredient.objects.filter(
                        recipe_id=OuterRef("pk"),
                        deleted_on__isnull=True
                    ).exclude(
                        ingredient__dietary_info__contains=[tag]
                    )

                    queryset = queryset.filter(
                        ~Exists(bad_ingredient_qs)
                    )

            # at least one recipe ingredient must have tags
            for tag in diet_info_list:
                if tag not in STRICT_TAGS:
                    queryset = queryset.filter(
                        recipe_ingredients__deleted_on__isnull=True,
                        recipe_ingredients__ingredient__dietary_info__contains=[tag]
                    )

            queryset = queryset.distinct()


        queryset = queryset.filter(filters)

        # Filter out recipes containing excluded allergens
        if exclude_allergens:
            # Parse comma-separated allergens
            allergens_to_exclude = [a.strip().lower() for a in exclude_allergens.split(',') if a.strip()]
            
            if allergens_to_exclude:
                # Get recipe IDs that contain any of the excluded allergens
                # We need to check through RecipeIngredient -> Ingredient -> allergens JSONField
                recipe_ids_with_allergens = set()
                
                for allergen in allergens_to_exclude:
                    # Find all ingredients that contain this allergen
                    # For JSONField list, use contains with the value directly (not as a list)
                    ingredients_with_allergen = Ingredient.objects.filter(
                        allergens__contains=allergen
                    )
                    
                    # Find all recipes that use these ingredients
                    recipe_ids = RecipeIngredient.objects.filter(
                        ingredient__in=ingredients_with_allergen,
                        deleted_on__isnull=True
                    ).values_list('recipe_id', flat=True).distinct()
                    
                    recipe_ids_with_allergens.update(recipe_ids)
                
                # Exclude recipes that contain any of the excluded allergens
                if recipe_ids_with_allergens:
                    queryset = queryset.exclude(id__in=recipe_ids_with_allergens)

        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RecipeListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = RecipeListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
class MealPlannerPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


@api_view(['GET'])
def get_user_recipe_count(request, user_id):
    """
    Get the number of recipes created by a specific user
    """
    try:
        recipe_count = Recipe.objects.filter(creator_id=user_id, deleted_on=None).count()
        badge = None
        if recipe_count >=10:
            badge = "Experienced Home Cook"
        elif recipe_count >=5:
            badge = "Home Cook"
        return Response({'user_id': user_id, 'recipe_count': recipe_count, 'badge': badge}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)