"""
Reporting application models for banking reconciliation system.
Contains: Report, ReportRun
NOTA: Esta app fue renombrada desde 'transactions' a 'reporting'.
Actualizar todas las referencias en templates, estáticos y URLs.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Report(models.Model):
    """
    Definición de reporte configurable.
    """
    TYPE_CHOICES = [
        ('financial', _('Financial')),
        ('compliance', _('Compliance')),
        ('custom', _('Custom')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    name = models.CharField(max_length=200, verbose_name=_('Name'))
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name=_('Type'))
    created_by_user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports',
        verbose_name=_('Created By')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))
    filters = models.JSONField(blank=True, null=True, verbose_name=_('Filters'))

    class Meta:
        db_table = 'reporting_report'
        verbose_name = _('Report')
        verbose_name_plural = _('Reports')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='reporting_report_name_idx'),
            models.Index(fields=['type'], name='reporting_report_type_idx'),
            models.Index(fields=['created_by_user_id'], name='reporting_report_createdby_idx'),
            models.Index(fields=['created_at'], name='reporting_report_created_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class ReportRun(models.Model):
    """
    Ejecución de un reporte generado.
    Almacena el estado y ubicación del resultado.
    """
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    report_id = models.ForeignKey(
        'Report',
        on_delete=models.PROTECT,
        related_name='report_runs',
        verbose_name=_('Report')
    )
    run_at = models.DateTimeField(verbose_name=_('Run At'))
    generated_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Generated At'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name=_('Status'))
    result_location = models.CharField(max_length=500, blank=True, null=True, verbose_name=_('Result Location'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))

    class Meta:
        db_table = 'reporting_reportrun'
        verbose_name = _('Report Run')
        verbose_name_plural = _('Report Runs')
        ordering = ['-run_at']
        indexes = [
            models.Index(fields=['report_id'], name='reporting_reportrun_report_idx'),
            models.Index(fields=['status'], name='reporting_reportrun_status_idx'),
            models.Index(fields=['run_at'], name='reporting_reportrun_run_idx'),
            models.Index(fields=['generated_at'], name='reporting_reportrun_generated_idx'),
        ]

    def __str__(self):
        return f"{self.report_id.name} - {self.run_at} ({self.get_status_display()})"
