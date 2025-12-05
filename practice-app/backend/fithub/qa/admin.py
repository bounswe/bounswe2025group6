from django.contrib import admin
from qa.models import Answer, AnswerVote, Question, QuestionVote

admin.site.register(Question)
admin.site.register(QuestionVote)
admin.site.register(Answer)
admin.site.register(AnswerVote)
