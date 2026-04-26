"""
Bank Accounts application models for banking reconciliation system.
Contains: Bank, BankAccount, Office, AccountState, Operation
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Bank(models.Model):
    """
    Entidad bancaria.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    name = models.CharField(max_length=200, verbose_name=_('Name'))
    swift_code = models.CharField(max_length=11, blank=True, null=True, verbose_name=_('SWIFT Code'))
    country = models.CharField(max_length=2, blank=True, null=True, verbose_name=_('Country'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'bankaccounts_bank'
        verbose_name = _('Bank')
        verbose_name_plural = _('Banks')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='bankaccounts_bank_name_idx'),
            models.Index(fields=['swift_code'], name='bankaccounts_bank_swift_idx'),
            models.Index(fields=['country'], name='bankaccounts_bank_country_idx'),
        ]

    def __str__(self):
        return self.name


class BankAccount(models.Model):
    """
    Cuenta bancaria.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    code = models.CharField(max_length=50, unique=True, null=False, verbose_name=_('Code'))
    name = models.CharField(max_length=200, verbose_name=_('Name'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'bankaccounts_bankaccount'
        verbose_name = _('Bank Account')
        verbose_name_plural = _('Bank Accounts')
        ordering = ['code']
        indexes = [
            models.Index(fields=['code'], name='bankaccounts_bankaccount_code_idx'),
            models.Index(fields=['name'], name='bankaccounts_bankaccount_name_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Office(models.Model):
    """
    Oficina o sucursal.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    code = models.CharField(max_length=50, unique=True, null=False, verbose_name=_('Code'))
    name = models.CharField(max_length=200, verbose_name=_('Name'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'bankaccounts_office'
        verbose_name = _('Office')
        verbose_name_plural = _('Offices')
        ordering = ['code']
        indexes = [
            models.Index(fields=['code'], name='bankaccounts_office_code_idx'),
            models.Index(fields=['name'], name='bankaccounts_office_name_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class AccountState(models.Model):
    """
    Estado de cuenta bancario por período.
    Representa el balance oficial de una cuenta en un rango de fechas.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    bank_account_id = models.ForeignKey(
        'BankAccount',
        on_delete=models.PROTECT,
        related_name='account_states',
        verbose_name=_('Bank Account')
    )
    period_start = models.DateField(verbose_name=_('Period Start'))
    period_end = models.DateField(verbose_name=_('Period End'))
    balance = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Balance'))
    reconciled_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Reconciled At'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'bankaccounts_accountstate'
        verbose_name = _('Account State')
        verbose_name_plural = _('Account States')
        ordering = ['bank_account_id', '-period_end']
        constraints = [
            models.UniqueConstraint(
                fields=['bank_account_id', 'period_start', 'period_end'],
                name='unique_account_state_period'
            )
        ]
        indexes = [
            models.Index(fields=['bank_account_id'], name='bankaccounts_acctstate_account_idx'),
            models.Index(fields=['period_start'], name='bankaccounts_acctstate_period_start_idx'),
            models.Index(fields=['period_end'], name='bankaccounts_acctstate_period_end_idx'),
            models.Index(fields=['reconciled_at'], name='bankaccounts_acctstate_reconciled_idx'),
        ]

    def __str__(self):
        return f"{self.bank_account_id.code} ({self.period_start} - {self.period_end})"


class Operation(models.Model):
    """
    Tipo de operación bancaria.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    code = models.CharField(max_length=50, unique=True, null=False, verbose_name=_('Code'))
    name = models.CharField(max_length=200, verbose_name=_('Name'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'bankaccounts_operation'
        verbose_name = _('Operation')
        verbose_name_plural = _('Operations')
        ordering = ['code']
        indexes = [
            models.Index(fields=['code'], name='bankaccounts_operation_code_idx'),
            models.Index(fields=['name'], name='bankaccounts_operation_name_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"
