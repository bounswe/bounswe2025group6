from django.utils import timezone
from rest_framework.authtoken.models import Token
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
import datetime

class SessionTimeoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Get the user's token
            try:
                token = Token.objects.get(user=request.user)
                last_activity = token.created

                # Check if the token has expired (30 minutes)
                if (timezone.now() - last_activity) > datetime.timedelta(seconds=settings.SESSION_COOKIE_AGE):
                    # Delete the token
                    token.delete()
                    return Response(
                        {"detail": "Session expired. Please login again."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Update token creation time to reset timeout
                token.created = timezone.now()
                token.save()
            
            except Token.DoesNotExist:
                pass

        response = self.get_response(request)
        return response
