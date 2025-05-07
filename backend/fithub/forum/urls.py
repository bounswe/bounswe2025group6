# forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forum.views import ForumPostViewSet, ForumPostCommentViewSet

router = DefaultRouter()
router.register(r'posts', ForumPostViewSet, basename='forum-post') # For forum post endpoints
router.register(r'posts/(?P<post_id>\d+)/comments', ForumPostCommentViewSet, basename='forum-post-comments')  # Forum post comment endpoints


urlpatterns = [
    path('', include(router.urls)),
]