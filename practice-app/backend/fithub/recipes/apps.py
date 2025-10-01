from django.apps import AppConfig


class RecipesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recipes'

    # Import and register the signals when the app is ready
    # Like, rate, comment count updates
    def ready(self):
        import recipes.signals  # This connects the signals in signals.py