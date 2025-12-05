# forum/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from qa.views import AnswerViewSet, AnswerVoteView, QuestionViewSet, QuestionVoteView

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='qa-question')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'questions/<int:post_id>/answers/',
        AnswerViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='question-answer-list-create'
    ),
    path(
        'questions/<int:post_id>/answers/<int:comment_id>/',
        AnswerViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}),
        name='question-answer-detail'
    ),
    path('question/<int:post_id>/vote/', QuestionVoteView.as_view(), name='question-vote'),
    path('answer/<int:comment_id>/vote/', AnswerVoteView.as_view(), name='answer-vote')
]