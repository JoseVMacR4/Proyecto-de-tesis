from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.users.models import Role, UserRole

User = get_user_model()

@receiver(post_save, sender=User)
def assign_superuser_role(sender, instance, created, **kwargs):
    # Si el usuario se acaba de crear y tiene el check de superusuario
    if created and instance.is_superuser:
        # 1. Asegurarnos de que el rol Administrador exista (lo crea si no existe)
        admin_role, _ = Role.objects.get_or_create(name='Administrador')
        
        # 2. Asignarle automáticamente el rol al usuario
        UserRole.objects.get_or_create(user=instance, role=admin_role)