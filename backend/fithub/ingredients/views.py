# ingredients/views.py
from rest_framework import viewsets
from .models import Ingredient
from .serializers import IngredientSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class IngredientPagination(PageNumberPagination):
    page_size = 10                       # Customize the number of items per page
    page_size_query_param = 'page_size'  # Allow the client to adjust page size
    max_page_size = 100                  # Maximum number of items per page

    def get_paginated_response(self, data):
        # Get the current page and page size
        page = self.page.number
        page_size = self.page.paginator.per_page

        # Return the custom response
        return Response({
            'page': page,
            'page_size': page_size,
            'count': self.page.paginator.count,            # Total number of items
            'total_pages': self.page.paginator.num_pages,  # Total number of pages
            'results': data
        })

# Only the get method is allowed for this viewset
class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing ingredient instances.
    """
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    pagination_class = IngredientPagination
