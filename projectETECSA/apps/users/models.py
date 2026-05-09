import uuid

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError(_('The username must be set'))
        username = self.model.normalize_username(username)
        user = self.model(username=username, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.password = ''
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password, **extra_fields):
        extra_fields.setdefault('is_active', True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    password = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    avatar_color = models.CharField(max_length=7, default='#1E88E5')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['username']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.username

    # Nota: la contraseña debe gestionarse siempre con set_password() y nunca guardarse en texto plano.


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    description = models.CharField(max_length=255, blank=True)
    can_access_admin = models.BooleanField(default=False, verbose_name='Acceso al Panel de Administración')
    can_upload_statements = models.BooleanField(default=False, verbose_name='Subir Estados de Cuenta')
    can_reconcile = models.BooleanField(default=False, verbose_name='Conciliar')
    can_view_all = models.BooleanField(default=False, verbose_name='Ver Toda la Información')

    class Meta:
        verbose_name = _('Role')
        verbose_name_plural = _('Roles')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name


class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _('Permission')
        verbose_name_plural = _('Permissions')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name


class UserRole(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_roles',
    )
    role = models.ForeignKey(
        'users.Role',
        on_delete=models.CASCADE,
        related_name='user_roles',
    )

    class Meta:
        verbose_name = _('User Role')
        verbose_name_plural = _('User Roles')
        unique_together = [['user', 'role']]
        ordering = ['user__username', 'role__name']
        constraints = [
            models.UniqueConstraint(fields=['user', 'role'], name='unique_user_role'),
        ]

    def __str__(self):
        return f"{self.user} - {self.role}"


class RolePermission(models.Model):
    role = models.ForeignKey(
        'users.Role',
        on_delete=models.PROTECT,
        related_name='role_permissions',
    )
    permission = models.ForeignKey(
        'users.Permission',
        on_delete=models.PROTECT,
        related_name='role_permissions',
    )

    class Meta:
        verbose_name = _('Role Permission')
        verbose_name_plural = _('Role Permissions')
        unique_together = [['role', 'permission']]
        ordering = ['role__name', 'permission__name']
        constraints = [
            models.UniqueConstraint(fields=['role', 'permission'], name='unique_role_permission'),
        ]

    def __str__(self):
        return f"{self.role} - {self.permission}"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        INFO = 'info', _('Info')
        SUCCESS = 'success', _('Success')
        WARNING = 'warning', _('Warning')
        ERROR = 'error', _('Error')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    content = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"Notification to {self.user or 'Unknown'} - {self.type}"


class UserActivity(models.Model):
    class ActionType(models.TextChoices):
        LOGIN = 'login', _('Inicio de sesión')
        LOGOUT = 'logout', _('Cierre de sesión')
        CONCILIATION = 'conciliation', _('Conciliación')
        UPLOAD_STATEMENT = 'upload_statement', _('Subir estado de cuenta')
        CREATE_USER = 'create_user', _('Crear usuario')
        UPDATE_USER = 'update_user', _('Actualizar usuario')
        DELETE_USER = 'delete_user', _('Eliminar usuario')
        CREATE_BANK = 'create_bank', _('Crear banco')
        UPDATE_BANK = 'update_bank', _('Actualizar banco')
        DELETE_BANK = 'delete_bank', _('Eliminar banco')
        CREATE_OPERATION = 'create_operation', _('Crear operación')
        UPDATE_OPERATION = 'update_operation', _('Actualizar operación')
        DELETE_OPERATION = 'delete_operation', _('Eliminar operación')
        CREATE_OFFICE = 'create_office', _('Crear oficina')
        UPDATE_OFFICE = 'update_office', _('Actualizar oficina')
        DELETE_OFFICE = 'delete_office', _('Eliminar oficina')
        GENERATE_REPORT = 'generate_report', _('Generar reporte')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_activities',
    )
    action = models.CharField(max_length=30, choices=ActionType.choices)
    description = models.TextField()
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('User Activity')
        verbose_name_plural = _('User Activities')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.created_at}"


class BugReport(models.Model):
    class ReportType(models.TextChoices):
        ERROR = 'error', _('Error')
        ESTADOS_CUENTA = 'estados_cuenta', _('Estados de cuenta')
        CONCILIACION = 'conciliacion', _('Conciliación')
        TRANSACCIONES = 'transacciones', _('Transacciones')
        EXPORTACION = 'exportacion', _('Exportación')
        INFORMES = 'informes', _('Informes')
        NOTIFICACIONES = 'notificaciones', _('Notificaciones')
        USUARIO = 'usuario', _('Usuario')
        OTRO = 'otro', _('Otro')

    class StatusType(models.TextChoices):
        PENDING = 'pending', _('Pendiente')
        RESOLVED = 'resolved', _('Solucionado')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bug_reports',
    )
    type = models.CharField(max_length=30, choices=ReportType.choices)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=StatusType.choices, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Bug Report')
        verbose_name_plural = _('Bug Reports')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['status']),
            models.Index(fields=['reporter', '-created_at']),
        ]

    def __str__(self):
        return f"{self.subject} - {self.reporter.username}"
