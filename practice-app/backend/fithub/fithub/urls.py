"""
URL configuration for fithub project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from api.views import index
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Create the schema view for Swagger UI
schema_view = get_schema_view(
    openapi.Info(
        title="Fithub API",
        default_version='v1',
        description="API documentation for Fithub project",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="celilozkan76@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),  # Everyone can access the API documentation
)

urlpatterns = [
    path('', index, name='index_page'),  # Map the root URL to the index page view
    path('admin/', admin.site.urls),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # JWT token generation
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    path('api/', include('api.urls')),

    path('ingredients/', include('ingredients.urls')),
    path('recipes/', include('recipes.urls')),
    path('forum/', include('forum.urls')),
    path('reports/', include('reports.urls')),

]
