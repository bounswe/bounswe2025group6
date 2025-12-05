from django.db import models
from django.utils.timezone import now
from utils.models import CommentModel, CommentVoteModel, PostModel, PostVoteModel


class Question(PostModel):
    """Question asked by any registered user."""

    class TagChoices(models.TextChoices):
        BUDGET = 'Budget'
        MEAL_PREP = 'Meal Prep'
        FAMILY = 'Family'
        NO_WASTE = 'No Waste'
        SUSTAINABILITY = 'Sustainability'
        TIPS = 'Tips'
        GLUTEN_FREE = 'Gluten Free'
        VEGAN = 'Vegan'
        VEGETARIAN = 'Vegetarian'
        QUICK = 'Quick'
        HEALTHY = 'Healthy'
        STUDENT = 'Student'
        NUTRITION = 'Nutrition'
        HEALTHY_EATING = 'Healthy Eating'
        SNACKS = 'Snacks'

    tags = models.JSONField(default=list, blank=True)

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete this question and cascade to its related answers and votes.
        """
        self.deleted_on = now()
        self.save(update_fields=["deleted_on"])

        answers = self.answers.filter(deleted_on__isnull=True)
        for answer in answers:
            answer.deleted_on = now()
            answer.save(update_fields=["deleted_on"])
            answer.votes.filter(deleted_on__isnull=True).update(deleted_on=now())

        self.votes.filter(deleted_on__isnull=True).update(deleted_on=now())

    def __str__(self):
        return f"Question #{self.pk}, {self.title}"


class QuestionVote(PostVoteModel):
    post = models.ForeignKey(Question, related_name='votes', on_delete=models.CASCADE)


class Answer(CommentModel):
    post = models.ForeignKey('Question', related_name='answers', on_delete=models.CASCADE)

    def __str__(self):
        return f"Answer by {self.author} on Question {self.post.id}"

    def get_replies(self):
        return self.replies.all()

    def delete(self, using=None, keep_parents=False):
        """Soft delete this answer and its votes (and optional replies)."""
        self.deleted_on = now()
        self.save(update_fields=["deleted_on"])

        self.votes.filter(deleted_on__isnull=True).update(deleted_on=now())
        self.replies.filter(deleted_on__isnull=True).update(deleted_on=now())


class AnswerVote(CommentVoteModel):
    comment = models.ForeignKey(Answer, related_name='votes', on_delete=models.CASCADE)
