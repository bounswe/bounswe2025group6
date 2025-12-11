from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # -------------------------
        # QUESTION MODEL
        # -------------------------
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('deleted_on', models.DateTimeField(blank=True, null=True)),
                ('title', models.CharField(max_length=255)),
                ('content', models.TextField(max_length=2000)),
                ('is_commentable', models.BooleanField(default=True)),
                ('view_count', models.PositiveIntegerField(default=0)),
                ('upvote_count', models.PositiveIntegerField(default=0)),
                ('downvote_count', models.PositiveIntegerField(default=0)),
                ('tags', models.JSONField(default=list, blank=True)),
                ('author', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL
                )),
            ],
        ),

        # -------------------------
        # ANSWER MODEL
        # -------------------------
        migrations.CreateModel(
            name='Answer',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('deleted_on', models.DateTimeField(blank=True, null=True)),
                ('content', models.TextField(max_length=2000)),
                ('upvote_count', models.PositiveIntegerField(default=0)),
                ('downvote_count', models.PositiveIntegerField(default=0)),
                ('reported_count', models.PositiveIntegerField(default=0)),
                ('author', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL
                )),
                ('parent_comment', models.ForeignKey(
                    null=True,
                    blank=True,
                    related_name='replies',
                    on_delete=django.db.models.deletion.CASCADE,
                    to='qa.answer'
                )),
                ('post', models.ForeignKey(
                    related_name='answers',
                    on_delete=django.db.models.deletion.CASCADE,
                    to='qa.question'
                )),
            ],
        ),

        # -------------------------
        # QUESTION VOTE MODEL
        # -------------------------
        migrations.CreateModel(
            name='QuestionVote',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('deleted_on', models.DateTimeField(blank=True, null=True)),
                ('vote_type', models.CharField(max_length=5)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL
                )),
                ('post', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='votes',
                    to='qa.question'
                )),
            ],
        ),

        # -------------------------
        # ANSWER VOTE MODEL
        # -------------------------
        migrations.CreateModel(
            name='AnswerVote',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                ('deleted_on', models.DateTimeField(blank=True, null=True)),
                ('vote_type', models.CharField(max_length=5)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL
                )),
                ('comment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='votes',
                    to='qa.answer'
                )),
            ],
        ),
    ]