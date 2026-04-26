"""
Core application models for banking reconciliation system.
Contains: CodeCatalog, SystemSetting, AuditLog
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class CodeCatalog(models.Model):
    """
    Catálogo de códigos para oficinas, cuentas bancarias y operaciones.
    PK: code (CharField) en lugar de UUID.
    """
    CATEGORY_CHOICES = [
        ('office', _('Office')),
        ('bank_account', _('Bank Account')),
        ('operation', _('Operation')),
    ]

    code = models.CharField(max_length=50, primary_key=True, verbose_name=_('Code'))
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        verbose_name=_('Category')
    )
    description = models.CharField(max_length=255, blank=True, verbose_name=_('Description'))
    display_name = models.CharField(max_length=100, blank=True, verbose_name=_('Display Name'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'core_code_catalog'
        verbose_name = _('Code Catalog')
        verbose_name_plural = _('Code Catalogs')
        ordering = ['category', 'code']
        indexes = [
            models.Index(fields=['category'], name='core_codecatalog_category_idx'),
            models.Index(fields=['code'], name='core_codecatalog_code_idx'),
        ]

    def __str__(self):
        return f"{self.code} ({self.get_category_display()})"


class SystemSetting(models.Model):
    """
    Configuración del sistema almacenada como pares clave-valor JSON.
    PK: key (CharField).
    """
    key = models.CharField(max_length=100, primary_key=True, verbose_name=_('Key'))
    value = models.JSONField(verbose_name=_('Value'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'core_system_setting'
        verbose_name = _('System Setting')
        verbose_name_plural = _('System Settings')
        ordering = ['key']
        indexes = [
            models.Index(fields=['key'], name='core_systemsetting_key_idx'),
        ]

    def __str__(self):
        return self.key


class AuditLog(models.Model):
    """
    Registro de auditoría para rastrear acciones sobre recursos.
    Conectar con señales post_save/post_delete o middleware.
    
    Uso recomendado en señales:
        from django.db.models.signals import post_save, post_delete
        from django.dispatch import receiver
        
        @receiver(post_save, sender=BankAccount)
        def log_bankaccount_save(sender, instance, created, **kwargs):
            action = 'CREATE' if created else 'UPDATE'
            AuditLog.objects.create(
                actor_id=<user_id>,  # Obtener del contexto/thread local
                action=action,
                resource='bankaccounts.BankAccount',
                resource_id=str(instance.id),
                details={'changed_fields': [...]}
            )
    """
    ACTION_CHOICES = [
        ('CREATE', _('Create')),
        ('UPDATE', _('Update')),
        ('DELETE', _('Delete')),
        ('LOGIN', _('Login')),
        ('LOGOUT', _('Logout')),
        ('EXPORT', _('Export')),
        ('IMPORT', _('Import')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    actor_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        verbose_name=_('Actor')
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name=_('Action'))
    resource = models.CharField(max_length=100, verbose_name=_('Resource'))
    resource_id = models.CharField(max_length=50, verbose_name=_('Resource ID'))
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_('Timestamp'))
    details = models.JSONField(blank=True, null=True, verbose_name=_('Details'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))

    class Meta:
        db_table = 'core_audit_log'
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp'], name='core_auditlog_timestamp_idx'),
            models.Index(fields=['actor_id'], name='core_auditlog_actor_idx'),
            models.Index(fields=['resource'], name='core_auditlog_resource_idx'),
            models.Index(fields=['action'], name='core_auditlog_action_idx'),
            models.Index(fields=['resource', 'resource_id'], name='core_auditlog_resource_lookup_idx'),
        ]

    def __str__(self):
        return f"{self.action} - {self.resource} ({self.resource_id}) @ {self.timestamp}"
