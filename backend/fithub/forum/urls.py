# forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forum.views import ForumPostViewSet, ForumPostCommentViewSet

router = DefaultRouter()
router.register(r'posts', ForumPostViewSet, basename='forum-post') # For forum post endpoints

urlpatterns = [
    path('', include(router.urls)),

    # Manual nested routes for comments
    path(
        'posts/<int:post_id>/comments/',
        ForumPostCommentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='forumpostcomment-list-create'
    ),
    path(
        'posts/<int:post_id>/comments/<int:pk>/',
        ForumPostCommentViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}),
        name='forumpostcomment-detail'
    ),
]