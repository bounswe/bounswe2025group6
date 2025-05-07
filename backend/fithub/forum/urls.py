# forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forum.views import ForumPostViewSet, ForumPostCommentViewSet

router = DefaultRouter()
router.register(r'posts', ForumPostViewSet, basename='forumpost') # For forum post endpoints
router.register(r'posts/(?P<post_id>\d+)/comments', ForumPostCommentViewSet, basename='forumpost-comments')  # Forum post comment endpoints


urlpatterns = [
    path('', include(router.urls)),
]