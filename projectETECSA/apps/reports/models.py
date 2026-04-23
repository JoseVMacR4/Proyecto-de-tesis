import uuid
from django.db import models
from django.conf import settings


class Reminder(models.Model):
    """
    Recordatorios para usuarios
    """
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
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reminders'
        verbose_name = 'Recordatorio'
        verbose_name_plural = 'Recordatorios'
        ordering = ['due_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['due_at']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class Notification(models.Model):
    """
    Notificaciones para usuarios
    """
    TYPE_CHOICES = [
        ('info', 'Información'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['read_at']),
            models.Index(fields=['type']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"[{self.type}] {self.content[:50]}"


class Report(models.Model):
    """
    Definición de reportes configurables
    """
    TYPE_CHOICES = [
        ('financial', 'Financiero'),
        ('compliance', 'Cumplimiento'),
        ('custom', 'Personalizado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports'
    )
    filters = models.JSONField(null=True, blank=True, help_text='Configuración de filtros del reporte')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ReportRun(models.Model):
    """
    Ejecuciones de reportes
    """
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='runs'
    )
    run_at = models.DateTimeField()
    generated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    result_location = models.CharField(max_length=500, null=True, blank=True, help_text='Ruta o URL del resultado')
    
    class Meta:
        db_table = 'report_runs'
        verbose_name = 'Ejecución de Reporte'
        verbose_name_plural = 'Ejecuciones de Reportes'
        ordering = ['-run_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['run_at']),
            models.Index(fields=['report']),
        ]
    
    def __str__(self):
        return f"{self.report.name} - {self.run_at}"


class SystemSetting(models.Model):
    """
    Configuraciones del sistema almacenadas como clave-valor
    """
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'Configuración del Sistema'
        verbose_name_plural = 'Configuraciones del Sistema'
        ordering = ['key']
    
    def __str__(self):
        return self.key
