import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User"""
    
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('El username es obligatorio')
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Modelo personalizado de usuario con UUID"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    
    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        db_table = 'users'
    
    def __str__(self):
        return self.username


class Role(models.Model):
    """Modelo para roles del sistema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        db_table = 'roles'
    
    def __str__(self):
        return self.name


class Permission(models.Model):
    """Modelo para permisos del sistema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"
        db_table = 'permissions'
    
    def __str__(self):
        return self.name


class UserRole(models.Model):
    """Tabla intermedia para relación many-to-many entre User y Role"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Rol de Usuario"
        verbose_name_plural = "Roles de Usuario"
        db_table = 'user_roles'
        unique_together = ['user', 'role']
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"


class RolePermission(models.Model):
    """Tabla intermedia para relación many-to-many entre Role y Permission"""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='permission_roles')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Permiso de Rol"
        verbose_name_plural = "Permisos de Rol"
        db_table = 'role_permissions'
        unique_together = ['role', 'permission']
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"


class AuditLog(models.Model):
    """Modelo para auditoría centralizada"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50)
    resource = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Log de Auditoría"
        verbose_name_plural = "Logs de Auditoría"
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['resource']),
            models.Index(fields=['actor']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.resource} ({self.timestamp})"


class Reminder(models.Model):
    """Modelo para recordatorios"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('sent', 'Enviado'),
        ('dismissed', 'Descartado'),
        ('completed', 'Completado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    due_at = models.DateTimeField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Recordatorio"
        verbose_name_plural = "Recordatorios"
        db_table = 'reminders'
        ordering = ['due_at']
    
    def __str__(self):
        return self.title


class Notification(models.Model):
    """Modelo para notificaciones"""
    TYPE_CHOICES = [
        ('info', 'Información'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content = models.TextField()
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.type} - {self.created_at.strftime('%Y-%m-%d')}"