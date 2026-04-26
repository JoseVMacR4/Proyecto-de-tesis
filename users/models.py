"""
Users application models for banking reconciliation system.
Contains: User, Role, Permission, UserRole, RolePermission, Notification, Reminder
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class User(models.Model):
    """
    Modelo de usuario personalizado.
    NOTA: El campo `password` debe gestionarse con set_password()/check_password().
    No almacenar contraseñas en texto plano.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    username = models.CharField(
        max_length=150,
        unique=True,
        null=False,
        verbose_name=_('Username')
    )
    email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
        verbose_name=_('Email')
    )
    password = models.CharField(max_length=128, verbose_name=_('Password'))
    is_active = models.BooleanField(default=True, verbose_name=_('Active'))
    first_name = models.CharField(max_length=150, blank=True, verbose_name=_('First Name'))
    last_name = models.CharField(max_length=150, blank=True, verbose_name=_('Last Name'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'users_user'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['username']
        indexes = [
            models.Index(fields=['username'], name='users_user_username_idx'),
            models.Index(fields=['email'], name='users_user_email_idx'),
            models.Index(fields=['is_active'], name='users_user_is_active_idx'),
        ]

    def __str__(self):
        return self.username

    def get_full_name(self):
        """Retorna nombre completo del usuario."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username


class Role(models.Model):
    """
    Roles para sistema RBAC (Role-Based Access Control).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    name = models.CharField(max_length=100, unique=True, verbose_name=_('Name'))
    description = models.CharField(max_length=255, blank=True, verbose_name=_('Description'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'users_role'
        verbose_name = _('Role')
        verbose_name_plural = _('Roles')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='users_role_name_idx'),
        ]

    def __str__(self):
        return self.name


class Permission(models.Model):
    """
    Permisos individuales para sistema RBAC.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    name = models.CharField(max_length=100, unique=True, verbose_name=_('Name'))
    description = models.CharField(max_length=255, blank=True, verbose_name=_('Description'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'users_permission'
        verbose_name = _('Permission')
        verbose_name_plural = _('Permissions')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='users_permission_name_idx'),
        ]

    def __str__(self):
        return self.name


class UserRole(models.Model):
    """
    Tabla intermedia para relación muchos-a-muchos entre User y Role.
    PK compuesta: (user_id, role_id)
    """
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='user_roles',
        verbose_name=_('User')
    )
    role_id = models.ForeignKey(
        'Role',
        on_delete=models.PROTECT,
        related_name='role_users',
        verbose_name=_('Role')
    )

    class Meta:
        db_table = 'users_user_role'
        verbose_name = _('User Role')
        verbose_name_plural = _('User Roles')
        constraints = [
            models.UniqueConstraint(fields=['user_id', 'role_id'], name='unique_user_role')
        ]
        ordering = ['user_id', 'role_id']
        indexes = [
            models.Index(fields=['user_id'], name='users_userrole_user_idx'),
            models.Index(fields=['role_id'], name='users_userrole_role_idx'),
        ]

    def __str__(self):
        return f"{self.user_id.username} - {self.role_id.name}"


class RolePermission(models.Model):
    """
    Tabla intermedia para relación muchos-a-muchos entre Role y Permission.
    PK compuesta: (role_id, permission_id)
    """
    role_id = models.ForeignKey(
        'Role',
        on_delete=models.PROTECT,
        related_name='role_permissions',
        verbose_name=_('Role')
    )
    permission_id = models.ForeignKey(
        'Permission',
        on_delete=models.PROTECT,
        related_name='permission_roles',
        verbose_name=_('Permission')
    )

    class Meta:
        db_table = 'users_role_permission'
        verbose_name = _('Role Permission')
        verbose_name_plural = _('Role Permissions')
        constraints = [
            models.UniqueConstraint(fields=['role_id', 'permission_id'], name='unique_role_permission')
        ]
        ordering = ['role_id', 'permission_id']
        indexes = [
            models.Index(fields=['role_id'], name='users_rolepermission_role_idx'),
            models.Index(fields=['permission_id'], name='users_rolepermission_permission_idx'),
        ]

    def __str__(self):
        return f"{self.role_id.name} - {self.permission_id.name}"


class Notification(models.Model):
    """
    Notificaciones para usuarios.
    """
    TYPE_CHOICES = [
        ('info', _('Info')),
        ('warning', _('Warning')),
        ('error', _('Error')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='notifications',
        verbose_name=_('User')
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name=_('Type'))
    content = models.TextField(verbose_name=_('Content'))
    read_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Read At'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))

    class Meta:
        db_table = 'users_notification'
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id'], name='users_notification_user_idx'),
            models.Index(fields=['type'], name='users_notification_type_idx'),
            models.Index(fields=['read_at'], name='users_notification_read_idx'),
            models.Index(fields=['created_at'], name='users_notification_created_idx'),
        ]

    def __str__(self):
        return f"[{self.get_type_display()}] {self.content[:50]}..."


class Reminder(models.Model):
    """
    Recordatorios programados para usuarios.
    """
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('sent', _('Sent')),
        ('dismissed', _('Dismissed')),
        ('completed', _('Completed')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    title = models.CharField(max_length=200, verbose_name=_('Title'))
    message = models.TextField(verbose_name=_('Message'))
    due_at = models.DateTimeField(verbose_name=_('Due At'))
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reminders',
        verbose_name=_('User')
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name=_('Status'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'users_reminder'
        verbose_name = _('Reminder')
        verbose_name_plural = _('Reminders')
        ordering = ['due_at']
        indexes = [
            models.Index(fields=['user_id'], name='users_reminder_user_idx'),
            models.Index(fields=['status'], name='users_reminder_status_idx'),
            models.Index(fields=['due_at'], name='users_reminder_due_idx'),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
