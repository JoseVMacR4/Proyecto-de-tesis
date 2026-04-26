import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class CodeCatalog(models.Model):
    class CategoryChoices(models.TextChoices):
        OFFICE = 'office', _('Office')
        BANK_ACCOUNT = 'bank_account', _('Bank Account')
        OPERATION = 'operation', _('Operation')

    code = models.CharField(max_length=50, primary_key=True)
    category = models.CharField(max_length=30, choices=CategoryChoices.choices)
    description = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Code Catalog')
        verbose_name_plural = _('Code Catalogs')
        ordering = ['code']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['display_name']),
        ]

    def __str__(self):
        return self.display_name or self.code


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('System Setting')
        verbose_name_plural = _('System Settings')
        ordering = ['key']
        indexes = [
            models.Index(fields=['key']),
        ]

    def __str__(self):
        return self.key


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=150)
    resource = models.CharField(max_length=255)
    resource_id = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(blank=True, null=True)

    class Meta:
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['resource']),
        ]

    def __str__(self):
        return f"{self.resource} - {self.action} @ {self.timestamp.isoformat()}"

    # Conectar con señales post_save/post_delete o middleware de auditoría
    # permite registrar cambios de entidades críticas sin acoplar lógica aquí.
