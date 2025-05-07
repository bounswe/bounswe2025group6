# forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forum.views import ForumPostViewSet

router = DefaultRouter()
router.register(r'posts', ForumPostViewSet, basename='forumpost') # For forum post endpoints

urlpatterns = [
    path('', include(router.urls)),
]