# forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forum.views import ForumPostViewSet, ForumTagViewSet

router = DefaultRouter()
router.register(r'posts', ForumPostViewSet, basename='forumpost') # For forum post endpoints
router.register(r'tags', ForumTagViewSet, basename='forumtag') # For tags and points

urlpatterns = [
    path('', include(router.urls)),
]