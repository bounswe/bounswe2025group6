# utils/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardPagination(PageNumberPagination):
    page_size = 10  # Default number of items per page
    page_size_query_param = 'page_size'  # Allow clients to specify page size
    max_page_size = 100  # Limit on the maximum number of items a client can request

    def paginate_queryset(self, queryset, request, view=None):
        # Ensure queryset is ordered explicitly to avoid the warning
        if queryset and not queryset.query.order_by:
            queryset = queryset.order_by('created_at')  # Add your desired ordering
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        return Response({
            'page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'total': self.page.paginator.count,
            'results': data,
        })