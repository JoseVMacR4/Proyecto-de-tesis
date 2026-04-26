import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Report(models.Model):
    class ReportType(models.TextChoices):
        FINANCIAL = 'financial', _('Financial')
        COMPLIANCE = 'compliance', _('Compliance')
        CUSTOM = 'custom', _('Custom')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=ReportType.choices)
    created_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_reports',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filters = models.JSONField(blank=True, null=True)

    class Meta:
        verbose_name = _('Report')
        verbose_name_plural = _('Reports')
        ordering = ['name']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name


class ReportRun(models.Model):
    class RunStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        'reporting.Report',
        on_delete=models.PROTECT,
        related_name='runs',
    )
    run_at = models.DateTimeField()
    generated_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=RunStatus.choices)
    result_location = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = _('Report Run')
        verbose_name_plural = _('Report Runs')
        ordering = ['-run_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['run_at']),
        ]

    def __str__(self):
        return f"{self.report.name} - {self.run_at.isoformat()}"
