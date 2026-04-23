import uuid
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Modelo de auditoría centralizada
    - Registra todas las acciones importantes del sistema
    - Permite trazabilidad completa de operaciones
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text='Usuario que realizó la acción'
    )
    action = models.CharField(max_length=50, db_index=True)
    resource = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=100, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    details = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['resource']),
            models.Index(fields=['actor']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.resource} ({self.timestamp})"
