from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'apps.users'

    def ready(self):
        # Importar las señales cuando la aplicación arranque
        import apps.users.signals