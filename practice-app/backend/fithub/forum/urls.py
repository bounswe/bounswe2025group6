# forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forum.views import ForumPostViewSet, ForumPostVoteView, ForumPostCommentViewSet, ForumPostCommentVoteView

router = DefaultRouter()
router.register(r'posts', ForumPostViewSet, basename='forum-post') # For forum post endpoints

urlpatterns = [
    path('', include(router.urls)),

    # Manual nested routes for comments (get detailed/list, create, delete)
    path(
        'posts/<int:post_id>/comments/',
        ForumPostCommentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='forumpostcomment-list-create'
    ),
    path(
        'posts/<int:post_id>/comments/<int:comment_id>/',
        ForumPostCommentViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}),
        name='forumpostcomment-detail'
    ),

    path('post/<int:post_id>/vote/', ForumPostVoteView.as_view(), name='post-vote'),
    path('comment/<int:comment_id>/vote/', ForumPostCommentVoteView.as_view(), name='comment-vote')
]