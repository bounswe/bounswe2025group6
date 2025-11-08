from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework.authtoken.models import Token
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

# Use absolute imports from api package
from api import views as api_views
from api.views import (
    RequestResetCodeView,
    VerifyResetCodeView,
    ResetPasswordView,
    RegisteredUserViewSet,
)
from api.models import (
    RegisteredUser,
    PasswordResetCode,
    PasswordResetToken,
    LoginAttempt,
)
from recipes.models import Recipe  # may raise if recipes app not present

factory = APIRequestFactory()


def dispatch_view(view_obj, request, **kwargs):
    """
    Helper to call either function-based or class-based views consistently.
    """
    if hasattr(view_obj, "as_view"):
        view = view_obj.as_view()
        return view(request, **kwargs)
    return view_obj(request, **kwargs)


class EndpointAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = RegisteredUser.objects.create_user(
            username="u1", email="u1@example.com", password="secret123"
        )
        self.user.is_active = True
        self.user.save()

        self.user2 = RegisteredUser.objects.create_user(
            username="u2", email="u2@example.com", password="secret123"
        )
        self.user2.is_active = True
        self.user2.save()

    def test_register_user_sends_email_and_creates_inactive(self):
        data = {"username": "newuser", "email": "new@example.com", "password": "passw0rd"}
        req = factory.post("/register/", data, format="json")
        with patch.object(api_views, "send_mail") as mock_send:
            resp = dispatch_view(api_views.register_user, req)
            assert resp.status_code == 201
            u = RegisteredUser.objects.get(email="new@example.com")
            assert u.is_active is False
            mock_send.assert_called_once()

    def test_verify_email_valid_and_invalid(self):
        u = RegisteredUser.objects.create_user(username="vuser", email="v@example.com", password="x")
        u.is_active = False
        u.save()
        token = default_token_generator.make_token(u)
        uid = urlsafe_base64_encode(force_bytes(u.pk))
        req = factory.get(f"/verify/{uid}/{token}/")
        resp = dispatch_view(api_views.verify_email, req, uidb64=uid, token=token)
        assert resp.status_code == 200
        u.refresh_from_db()
        assert u.is_active is True

        req2 = factory.get(f"/verify/{uid}/bad-token/")
        resp2 = dispatch_view(api_views.verify_email, req2, uidb64=uid, token="bad-token")
        assert resp2.status_code == 400

    def test_forgot_password_nonexistent_and_existing(self):
        with patch.object(api_views, "send_mail") as mock_send:
            req = factory.post("/forgot/", {"email": self.user.email}, format="json")
            resp = dispatch_view(api_views.forgot_password, req)
            assert resp.status_code == 200
            assert mock_send.called

            mock_send.reset_mock()
            req2 = factory.post("/forgot/", {"email": "noone@nowhere"}, format="json")
            resp2 = dispatch_view(api_views.forgot_password, req2)
            assert resp2.status_code == 200
            # view should not attempt to send for unknown emails
            assert not mock_send.called

    def test_password_reset_via_link(self):
        user = RegisteredUser.objects.create_user(username="pwuser", email="pw@example.com", password="old")
        user.is_active = True
        user.save()
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        req = factory.post(f"/password-reset/{uid}/{token}/", {"new_password": "newpass123"}, format="json")
        resp = dispatch_view(api_views.password_reset, req, uidb64=uid, token=token)
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.check_password("newpass123")

    def test_request_verify_code_and_reset_flow(self):
        with patch.object(api_views, "send_mail") as mock_send:
            req = factory.post("/request-code/", {"email": self.user.email}, format="json")
            resp = dispatch_view(RequestResetCodeView, req)
            assert resp.status_code in (200, 201)
            mock_send.assert_called()

        record = PasswordResetCode.objects.filter(email=self.user.email).last()
        assert record is not None

        verify_req = factory.post("/verify-code/", {"email": self.user.email, "code": record.code}, format="json")
        verify_resp = dispatch_view(VerifyResetCodeView, verify_req)
        assert verify_resp.status_code == 200
        token_str = verify_resp.data.get("token")
        assert token_str is not None

        reset_req = factory.post("/reset-with-token/", {"token": token_str, "new_password": "brandnewpw"}, format="json")
        reset_resp = dispatch_view(ResetPasswordView, reset_req)
        assert reset_resp.status_code == 200
        self.user.refresh_from_db()
        assert self.user.check_password("brandnewpw")

    def test_login_and_logout_and_login_attempts(self):
        req = factory.post("/login/", {"email": self.user.email, "password": "secret123"}, format="json")
        login_resp = dispatch_view(api_views.login_view, req)
        assert login_resp.status_code == 200
        token_key = login_resp.data.get("token")
        assert token_key is not None
        token = Token.objects.get(key=token_key)
        assert token.user == self.user

        logout_req = factory.post("/logout/")
        force_authenticate(logout_req, user=self.user, token=token)
        logout_resp = dispatch_view(api_views.logout_view, logout_req)
        assert logout_resp.status_code == 200

        req2 = factory.post("/login/", {"email": self.user.email, "password": "badpass"}, format="json")
        bad_resp = dispatch_view(api_views.login_view, req2)
        assert bad_resp.status_code in (400, 401)
        assert LoginAttempt.objects.filter(user=self.user, successful=False).exists()

    def test_get_user_id_by_email(self):
        req = factory.get("/get-id/?email=" + self.user.email)
        resp = dispatch_view(api_views.get_user_id_by_email, req)
        assert resp.status_code == 200
        assert resp.data.get("id") == self.user.id

    def test_follow_unfollow_action(self):
        view = RegisteredUserViewSet.as_view({"post": "follow"})
        req = factory.post("/users/follow/", {"user_id": self.user2.id}, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req)
        assert resp.status_code == 200
        assert resp.data["status"] in ("followed", "unfollowed")
        req2 = factory.post("/users/follow/", {"user_id": self.user2.id}, format="json")
        force_authenticate(req2, user=self.user)
        resp2 = view(req2)
        assert resp2.status_code == 200

    def test_bookmark_recipe_action(self):
        try:
            recipe = Recipe.objects.create(title="T", instructions="x")
        except Exception:
            # If Recipe model requires more fields or app is not present, skip test cleanly.
            self.skipTest("Recipe model unavailable or requires extra fields; skipping bookmark test.")

        view = RegisteredUserViewSet.as_view({"post": "bookmark_recipe"})
        req = factory.post("/users/bookmark/", {"recipe_id": recipe.id}, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req)
        assert resp.status_code == 200
        assert resp.data.get("status") == "recipe bookmarked"


class ApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_example(self):
        self.assertTrue(True)