from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from api.models import RegisteredUser
from reports.models import Report
from recipes.models import Recipe
from qa.models import Question, Answer


class ReportTests(APITestCase):
    def setUp(self):
        # Create regular users
        self.user1 = RegisteredUser.objects.create_user(
            username="user1", email="user1@example.com", password="pw12345"
        )
        self.user1.is_active = True
        self.user1.save()

        self.user2 = RegisteredUser.objects.create_user(
            username="user2", email="user2@example.com", password="pw12345"
        )
        self.user2.is_active = True
        self.user2.save()

        # Create admin user
        self.admin = RegisteredUser.objects.create_superuser(
            username="admin", email="admin@example.com", password="admin123"
        )
        self.admin.is_active = True
        self.admin.is_staff = True
        self.admin.save()

        # Create a recipe to report on
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user1
        )

    def test_list_reports_requires_authentication(self):
        """Test that listing reports requires authentication"""
        url = reverse('reports-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_can_create_report(self):
        """Test that authenticated user can create a report"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        data = {
            'content_type': 'recipe',
            'object_id': self.recipe.id,
            'report_type': 'spam',
            'description': 'This is spam content'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        report = Report.objects.first()
        self.assertEqual(report.reporter, self.user1)
        self.assertEqual(report.report_type, 'spam')

    def test_user_sees_only_own_reports(self):
        """Test that regular users only see their own reports"""
        # Create reports by both users
        recipe_content_type = ContentType.objects.get_for_model(Recipe)
        Report.objects.create(
            content_type=recipe_content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam',
            description='Report from user1'
        )
        Report.objects.create(
            content_type=recipe_content_type,
            object_id=self.recipe.id,
            reporter=self.user2,
            report_type='inappropriate',
            description='Report from user2'
        )

        # User1 should only see their own report
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['reporter_username'], 'user1')

    def test_admin_sees_all_reports(self):
        """Test that admin users can see all reports"""
        # Create reports by both users
        recipe_content_type = ContentType.objects.get_for_model(Recipe)
        Report.objects.create(
            content_type=recipe_content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam',
            description='Report from user1'
        )
        Report.objects.create(
            content_type=recipe_content_type,
            object_id=self.recipe.id,
            reporter=self.user2,
            report_type='inappropriate',
            description='Report from user2'
        )

        # Admin should see all reports
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_admin_can_resolve_report_keep_content(self):
        """Test that admin can resolve a report by keeping the content"""
        recipe_content_type = ContentType.objects.get_for_model(Recipe)
        report = Report.objects.create(
            content_type=recipe_content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam',
            description='Test report'
        )
        self.assertEqual(report.status, 'pending')

        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-keep', kwargs={'pk': report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, 'resolved')
        # Verify content still exists
        self.assertTrue(Recipe.objects.filter(id=self.recipe.id).exists())
    
    def test_user_can_report_question(self):
        """Test that authenticated user can create a report for a question"""
        question = Question.objects.create(
            title='Test Question',
            content='Test question content',
            author=self.user1
        )
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        data = {
            'content_type': 'question',
            'object_id': question.id,
            'report_type': 'inappropriate',
            'description': 'This question is inappropriate'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        report = Report.objects.first()
        self.assertEqual(report.reporter, self.user1)
        self.assertEqual(report.report_type, 'inappropriate')
        self.assertEqual(report.content_object, question)
    
    def test_user_can_report_answer(self):
        """Test that authenticated user can create a report for an answer"""
        question = Question.objects.create(
            title='Test Question',
            content='Test question content',
            author=self.user1
        )
        answer = Answer.objects.create(
            post=question,
            content='Test answer content',
            author=self.user2
        )
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        data = {
            'content_type': 'answer',
            'object_id': answer.id,
            'report_type': 'harassment',
            'description': 'This answer contains harassment'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        report = Report.objects.first()
        self.assertEqual(report.reporter, self.user1)
        self.assertEqual(report.report_type, 'harassment')
        self.assertEqual(report.content_object, answer)
    
    def test_admin_can_delete_reported_question(self):
        """Test that admin can resolve a report by deleting a question"""
        question = Question.objects.create(
            title='Test Question',
            content='Test question content',
            author=self.user1
        )
        question_content_type = ContentType.objects.get_for_model(Question)
        report = Report.objects.create(
            content_type=question_content_type,
            object_id=question.id,
            reporter=self.user1,
            report_type='spam',
            description='Test report'
        )
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-delete', kwargs={'pk': report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, 'resolved')
        # Verify question is soft-deleted
        question.refresh_from_db()
        self.assertIsNotNone(question.deleted_on)
    
    def test_admin_can_delete_reported_answer(self):
        """Test that admin can resolve a report by deleting an answer"""
        question = Question.objects.create(
            title='Test Question',
            content='Test question content',
            author=self.user1
        )
        answer = Answer.objects.create(
            post=question,
            content='Test answer content',
            author=self.user2
        )
        answer_content_type = ContentType.objects.get_for_model(Answer)
        report = Report.objects.create(
            content_type=answer_content_type,
            object_id=answer.id,
            reporter=self.user1,
            report_type='spam',
            description='Test report'
        )
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-delete', kwargs={'pk': report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, 'resolved')
        # Verify answer is soft-deleted
        answer.refresh_from_db()
        self.assertIsNotNone(answer.deleted_on)