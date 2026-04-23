import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User"""
    
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('El username es obligatorio')
        
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario personalizado
    - Login por username + password
    - Email opcional para recovery
    - Auditoría centralizada
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Para acceso al admin
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []  # email es opcional
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['created_at']
    
    def __str__(self):
        return self.username
    
    def get_full_name(self):
        full_name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return full_name if full_name else self.username


class Role(models.Model):
    """
    Roles para RBAC
    - Se asignan a usuarios vía UserRole
    - Tienen permisos vía RolePermission
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Permission(models.Model):
    """
    Permisos para RBAC
    - Se asignan a roles vía RolePermission
    - Formato recomendado: <app>.<action> (ej: bank_accounts.view, transactions.create)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class UserRole(models.Model):
    """
    Tabla intermedia para relación many-to-many entre User y Role
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users')
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_roles'
        verbose_name = 'Rol de Usuario'
        verbose_name_plural = 'Roles de Usuario'
        unique_together = ['user', 'role']
        ordering = ['assigned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"


class RolePermission(models.Model):
    """
    Tabla intermedia para relación many-to-many entre Role y Permission
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='permission_roles')
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'role_permissions'
        verbose_name = 'Permiso de Rol'
        verbose_name_plural = 'Permisos de Rol'
        unique_together = ['role', 'permission']
        ordering = ['assigned_at']
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"
