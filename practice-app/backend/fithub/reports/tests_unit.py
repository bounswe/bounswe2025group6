"""
Comprehensive Unit Tests for Reports App
Tests models, serializers, and views with edge cases
"""
from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from api.models import RegisteredUser
from reports.models import Report
from reports.serializers import ReportCreateSerializer, ReportSerializer
from recipes.models import Recipe
from forum.models import ForumPost, ForumPostComment
from unittest.mock import Mock


class ReportModelTests(TestCase):
    """Unit tests for Report model"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pw12345"
        )
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user
        )
        self.content_type = ContentType.objects.get_for_model(Recipe)
    
    def test_create_report(self):
        """Test creating a report"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam',
            description='This is spam'
        )
        self.assertEqual(report.reporter, self.user)
        self.assertEqual(report.report_type, 'spam')
        self.assertEqual(report.status, 'pending')
        self.assertIsNotNone(report.created_at)
    
    def test_report_type_choices(self):
        """Test report_type field choices"""
        valid_types = ['spam', 'inappropriate', 'harassment', 'other']
        for report_type in valid_types:
            report = Report.objects.create(
                content_type=self.content_type,
                object_id=self.recipe.id,
                reporter=self.user,
                report_type=report_type
            )
            self.assertEqual(report.report_type, report_type)
    
    def test_report_status_default(self):
        """Test that status defaults to 'pending'"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam'
        )
        self.assertEqual(report.status, 'pending')
    
    def test_report_status_choices(self):
        """Test status field choices"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam'
        )
        report.status = 'resolved'
        report.save()
        self.assertEqual(report.status, 'resolved')
    
    def test_report_str_representation(self):
        """Test string representation of report"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam'
        )
        self.assertIn('Report', str(report))
        self.assertIn('spam', str(report))
    
    def test_report_ordering(self):
        """Test that reports are ordered by created_at descending"""
        report1 = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam'
        )
        report2 = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='inappropriate'
        )
        reports = Report.objects.all()
        self.assertEqual(reports[0], report2)  # Most recent first
        self.assertEqual(reports[1], report1)


class ReportCreateSerializerTests(TestCase):
    """Unit tests for ReportCreateSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pw12345"
        )
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user
        )
        self.request = Mock()
        self.request.user = self.user
    
    def test_serializer_validates_recipe_content_type(self):
        """Test serializer validates recipe content type"""
        data = {
            'content_type': 'recipe',
            'object_id': self.recipe.id,
            'report_type': 'spam',
            'description': 'This is spam'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_validates_post_content_type(self):
        """Test serializer validates forum post content type"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
        data = {
            'content_type': 'post',
            'object_id': post.id,
            'report_type': 'inappropriate'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_validates_postcomment_content_type(self):
        """Test serializer validates post comment content type"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
        comment = ForumPostComment.objects.create(
            post=post,
            content='Test comment',
            author=self.user
        )
        data = {
            'content_type': 'postcomment',
            'object_id': comment.id,
            'report_type': 'harassment'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_rejects_invalid_content_type(self):
        """Test serializer rejects invalid content type"""
        data = {
            'content_type': 'invalid_type',
            'object_id': self.recipe.id,
            'report_type': 'spam'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())  # Validation happens in create()
        # Error is raised during save()
        with self.assertRaises(DRFValidationError):
            serializer.save()
    
    def test_serializer_rejects_nonexistent_object(self):
        """Test serializer rejects nonexistent object"""
        data = {
            'content_type': 'recipe',
            'object_id': 99999,
            'report_type': 'spam'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())  # Validation happens in create()
        # Error is raised during save()
        with self.assertRaises(Exception):  # ValidationError
            serializer.save()
    
    def test_serializer_creates_report(self):
        """Test serializer creates report"""
        data = {
            'content_type': 'recipe',
            'object_id': self.recipe.id,
            'report_type': 'spam',
            'description': 'This is spam'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())
        report = serializer.save()
        self.assertEqual(report.reporter, self.user)
        self.assertEqual(report.report_type, 'spam')
        self.assertEqual(report.content_object, self.recipe)
    
    def test_serializer_case_insensitive_content_type(self):
        """Test serializer handles case insensitive content type"""
        data = {
            'content_type': 'RECIPE',  # Uppercase
            'object_id': self.recipe.id,
            'report_type': 'spam'
        }
        serializer = ReportCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())


class ReportSerializerTests(TestCase):
    """Unit tests for ReportSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pw12345"
        )
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user
        )
        self.content_type = ContentType.objects.get_for_model(Recipe)
        self.report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam',
            description='This is spam'
        )
    
    def test_serializer_includes_reporter_username(self):
        """Test serializer includes reporter username"""
        serializer = ReportSerializer(instance=self.report)
        self.assertIn('reporter_username', serializer.data)
        self.assertEqual(serializer.data['reporter_username'], 'user1')
    
    def test_serializer_includes_content_type_name(self):
        """Test serializer includes content type name"""
        serializer = ReportSerializer(instance=self.report)
        self.assertIn('content_type_name', serializer.data)
        self.assertEqual(serializer.data['content_type_name'], 'recipe')
    
    def test_serializer_includes_content_object_preview(self):
        """Test serializer includes content object preview"""
        serializer = ReportSerializer(instance=self.report)
        self.assertIn('content_object_preview', serializer.data)
        self.assertIsNotNone(serializer.data['content_object_preview'])


class ReportViewSetEdgeCasesTests(APITestCase):
    """Unit tests for ReportViewSet with edge cases"""
    
    def setUp(self):
        self.user1 = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pw12345"
        )
        self.user1.is_active = True
        self.user1.save()
        
        self.user2 = RegisteredUser.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pw12345"
        )
        self.user2.is_active = True
        self.user2.save()
        
        self.admin = RegisteredUser.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
        self.admin.is_active = True
        self.admin.is_staff = True
        self.admin.save()
        
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user1
        )
        self.content_type = ContentType.objects.get_for_model(Recipe)
    
    def test_create_report_requires_authentication(self):
        """Test that creating report requires authentication"""
        url = reverse('reports-list')
        data = {
            'content_type': 'recipe',
            'object_id': self.recipe.id,
            'report_type': 'spam'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_report_invalid_content_type(self):
        """Test creating report with invalid content type"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        data = {
            'content_type': 'invalid_type',
            'object_id': self.recipe.id,
            'report_type': 'spam'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_report_nonexistent_object(self):
        """Test creating report for nonexistent object"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        data = {
            'content_type': 'recipe',
            'object_id': 99999,
            'report_type': 'spam'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_report_missing_fields(self):
        """Test creating report with missing required fields"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-list')
        data = {
            'content_type': 'recipe'
            # Missing object_id and report_type
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_cannot_update_others_reports(self):
        """Test that user cannot update others' reports"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam'
        )
        self.client.force_authenticate(user=self.user2)
        url = reverse('reports-detail', kwargs={'pk': report.id})
        data = {
            'description': 'Updated description'
        }
        response = self.client.patch(url, data, format='json')
        # User2 should not see user1's report, so should get 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_user_cannot_delete_others_reports(self):
        """Test that user cannot delete others' reports"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam'
        )
        self.client.force_authenticate(user=self.user2)
        url = reverse('reports-detail', kwargs={'pk': report.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_user_can_update_own_report(self):
        """Test that user can update their own report"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam',
            description='Original description'
        )
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-detail', kwargs={'pk': report.id})
        data = {
            'description': 'Updated description'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.description, 'Updated description')
    
    def test_user_can_delete_own_report(self):
        """Test that user can delete their own report"""
        report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user1,
            report_type='spam'
        )
        self.client.force_authenticate(user=self.user1)
        url = reverse('reports-detail', kwargs={'pk': report.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Report.objects.filter(id=report.id).exists())


class AdminReportViewSetEdgeCasesTests(APITestCase):
    """Unit tests for AdminReportViewSet with edge cases"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pw12345"
        )
        self.user.is_active = True
        self.user.save()
        
        self.admin = RegisteredUser.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
        self.admin.is_active = True
        self.admin.is_staff = True
        self.admin.save()
        
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user
        )
        self.content_type = ContentType.objects.get_for_model(Recipe)
        self.report = Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam',
            description='This is spam'
        )
    
    def test_resolve_keep_requires_admin(self):
        """Test that resolve_keep requires admin privileges"""
        self.client.force_authenticate(user=self.user)
        url = reverse('admin-reports-resolve-keep', kwargs={'pk': self.report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_resolve_keep_updates_status(self):
        """Test that resolve_keep updates report status"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-keep', kwargs={'pk': self.report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'resolved')
    
    def test_resolve_keep_preserves_content(self):
        """Test that resolve_keep does not delete content"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-keep', kwargs={'pk': self.report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Recipe should still exist
        self.assertTrue(Recipe.objects.filter(id=self.recipe.id).exists())
    
    def test_resolve_delete_requires_admin(self):
        """Test that resolve_delete requires admin privileges"""
        self.client.force_authenticate(user=self.user)
        url = reverse('admin-reports-resolve-delete', kwargs={'pk': self.report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_resolve_delete_deletes_content(self):
        """Test that resolve_delete deletes the reported content"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-delete', kwargs={'pk': self.report.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Recipe should be deleted
        self.assertFalse(Recipe.objects.filter(id=self.recipe.id).exists())
        # Report status should be resolved
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'resolved')
    
    def test_resolve_delete_nonexistent_report(self):
        """Test resolve_delete with nonexistent report"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-resolve-delete', kwargs={'pk': 99999})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_admin_sees_all_reports(self):
        """Test that admin can see all reports"""
        # Create reports by different users
        Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=self.user,
            report_type='spam'
        )
        user2 = RegisteredUser.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pw12345"
        )
        Report.objects.create(
            content_type=self.content_type,
            object_id=self.recipe.id,
            reporter=user2,
            report_type='inappropriate'
        )
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-reports-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see all reports (at least 3: self.report + 2 new ones)
        self.assertGreaterEqual(len(response.data.get('results', [])), 3)


class AdminLoginViewTests(APITestCase):
    """Unit tests for admin_login view"""
    
    def setUp(self):
        self.admin = RegisteredUser.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
        self.regular_user = RegisteredUser.objects.create_user(
            username="user",
            email="user@example.com",
            password="password123"
        )
    
    def test_admin_login_success(self):
        """Test successful admin login"""
        url = reverse('admin-login')
        response = self.client.post(url, {
            'username': 'admin',
            'password': 'admin123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        url = reverse('admin-login')
        response = self.client.post(url, {
            'username': 'admin',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_admin_login_regular_user(self):
        """Test that regular user cannot login via admin endpoint"""
        url = reverse('admin-login')
        response = self.client.post(url, {
            'username': 'user',
            'password': 'password123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_login_missing_credentials(self):
        """Test admin login with missing credentials"""
        url = reverse('admin-login')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_admin_check_authenticated_admin(self):
        """Test admin_check for authenticated admin"""
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_admin'])
    
    def test_admin_check_regular_user(self):
        """Test admin_check for regular user"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('admin-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_admin'])

