from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission, UserRole, RolePermission, AuditLog, Reminder, Notification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('email', 'first_name', 'last_name')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    filter_horizontal = ()


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'role__name')
    ordering = ('user',)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission', 'created_at')
    list_filter = ('role',)
    search_fields = ('role__name', 'permission__name')
    ordering = ('role',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'resource', 'resource_id', 'actor', 'timestamp')
    list_filter = ('action', 'resource', 'timestamp')
    search_fields = ('resource', 'resource_id', 'actor__username')
    readonly_fields = ('id', 'actor', 'action', 'resource', 'resource_id', 'timestamp', 'details')
    ordering = ('-timestamp',)


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'due_at', 'status', 'created_at')
    list_filter = ('status', 'due_at')
    search_fields = ('title', 'message', 'user__username')
    ordering = ('due_at',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'content', 'read_at', 'created_at')
    list_filter = ('type', 'read_at')
    search_fields = ('content', 'user__username')
    ordering = ('-created_at',)