import uuid
from django.db import models


class CodeCatalog(models.Model):
    """Catálogo de códigos para office, bank_account, operation, etc."""
    code = models.CharField(max_length=50, primary_key=True)
    category = models.CharField(max_length=50)
    description = models.CharField(max_length=255, blank=True, null=True)
    display_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Catálogo de Códigos"
        verbose_name_plural = "Catálogos de Códigos"
        db_table = 'code_catalog'
        ordering = ['category', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.display_name or self.description}"


class Office(models.Model):
    """Modelo para oficinas"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Oficina"
        verbose_name_plural = "Oficinas"
        db_table = 'offices'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Bank(models.Model):
    """Modelo para bancos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    swift_code = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Banco"
        verbose_name_plural = "Bancos"
        db_table = 'banks'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class BankAccount(models.Model):
    """Modelo para cuentas bancarias"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, null=True, blank=True, related_name='accounts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cuenta Bancaria"
        verbose_name_plural = "Cuentas Bancarias"
        db_table = 'bank_accounts'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Operation(models.Model):
    """Modelo para tipos de operaciones"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Operación"
        verbose_name_plural = "Operaciones"
        db_table = 'operations'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class AccountState(models.Model):
    """Historial de balances de cuentas bancarias"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='account_states')
    period_start = models.DateField()
    period_end = models.DateField()
    balance = models.DecimalField(max_digits=20, decimal_places=4)
    reconciled_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Estado de Cuenta"
        verbose_name_plural = "Estados de Cuenta"
        db_table = 'account_states'
        ordering = ['-period_end']
        indexes = [
            models.Index(fields=['bank_account', 'period_end']),
        ]
    
    def __str__(self):
        return f"{self.bank_account.code} - {self.period_end} ({self.balance})"


class SystemSetting(models.Model):
    """Configuraciones del sistema"""
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Configuración del Sistema"
        verbose_name_plural = "Configuraciones del Sistema"
        db_table = 'system_settings'
        ordering = ['key']
    
    def __str__(self):
        return self.key


class Report(models.Model):
    """Modelo para reportes"""
    TYPE_CHOICES = [
        ('financial', 'Financiero'),
        ('compliance', 'Cumplimiento'),
        ('custom', 'Personalizado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filters = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"
        db_table = 'reports'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ReportRun(models.Model):
    """Ejecuciones de reportes"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='runs')
    run_at = models.DateTimeField()
    generated_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    result_location = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Ejecución de Reporte"
        verbose_name_plural = "Ejecuciones de Reportes"
        db_table = 'report_runs'
        ordering = ['-run_at']
    
    def __str__(self):
        return f"{self.report.name} - {self.run_at}"