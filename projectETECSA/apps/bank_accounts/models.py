import uuid
from django.db import models


class Bank(models.Model):
    """
    Modelo opcional para bancos
    - Puede usarse para agrupar cuentas por banco
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    swift_code = models.CharField(max_length=11, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'banks'
        verbose_name = 'Banco'
        verbose_name_plural = 'Bancos'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Office(models.Model):
    """
    Oficinas sucursales
    - code con prefijo recomendado (ej: OF_001)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'offices'
        verbose_name = 'Oficina'
        verbose_name_plural = 'Oficinas'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class BankAccount(models.Model):
    """
    Cuentas bancarias
    - code con prefijo recomendado (ej: BA_001)
    - Sin FK obligatorias hacia Bank ni User
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    bank = models.ForeignKey(
        Bank,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accounts'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bank_accounts'
        verbose_name = 'Cuenta Bancaria'
        verbose_name_plural = 'Cuentas Bancarias'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Operation(models.Model):
    """
    Tipos de operaciones
    - code con prefijo recomendado (ej: OP_001)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'operations'
        verbose_name = 'Operación'
        verbose_name_plural = 'Operaciones'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class AccountState(models.Model):
    """
    Historial de balances de cuentas
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name='account_states'
    )
    period_start = models.DateField()
    period_end = models.DateField()
    balance = models.DecimalField(max_digits=20, decimal_places=4)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'account_states'
        verbose_name = 'Estado de Cuenta'
        verbose_name_plural = 'Estados de Cuenta'
        ordering = ['-period_end', 'bank_account']
        indexes = [
            models.Index(fields=['period_end']),
            models.Index(fields=['bank_account']),
        ]
        unique_together = ['bank_account', 'period_start', 'period_end']
    
    def __str__(self):
        return f"{self.bank_account.code} ({self.period_start} - {self.period_end})"
