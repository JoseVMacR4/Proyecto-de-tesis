"""
Reconciliation application models for banking reconciliation system.
Contains: BankStatement, BankStatementTransaction
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class BankStatement(models.Model):
    """
    Extracto bancario importado desde archivo.
    Contiene información de balances y período del extracto.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    bank_account_id = models.ForeignKey(
        'bankaccounts.BankAccount',
        on_delete=models.PROTECT,
        related_name='bank_statements',
        verbose_name=_('Bank Account')
    )
    file_name = models.CharField(max_length=255, verbose_name=_('File Name'))
    file_extension = models.CharField(max_length=10, verbose_name=_('File Extension'))
    statement_date = models.DateField(verbose_name=_('Statement Date'))
    period_start = models.DateField(verbose_name=_('Period Start'))
    period_end = models.DateField(verbose_name=_('Period End'))
    starting_balance = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Starting Balance'))
    ending_balance = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Ending Balance'))
    overdraft_balance = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Overdraft Balance'))
    reserved_balance = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Reserved Balance'))
    available_balance = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Available Balance'))
    entry_count = models.IntegerField(verbose_name=_('Entry Count'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'reconciliation_bankstatement'
        verbose_name = _('Bank Statement')
        verbose_name_plural = _('Bank Statements')
        ordering = ['-statement_date', 'bank_account_id']
        indexes = [
            models.Index(fields=['bank_account_id'], name='reconciliation_bankstmt_account_idx'),
            models.Index(fields=['statement_date'], name='reconciliation_bankstmt_date_idx'),
            models.Index(fields=['period_start'], name='reconciliation_bankstmt_period_start_idx'),
            models.Index(fields=['period_end'], name='reconciliation_bankstmt_period_end_idx'),
            models.Index(fields=['created_at'], name='reconciliation_bankstmt_created_idx'),
        ]

    def __str__(self):
        return f"{self.bank_account_id.code} - {self.statement_date}"


class BankStatementTransaction(models.Model):
    """
    Transacción individual dentro de un extracto bancario.
    NOTA: El campo `date` se deriva de bank_statement.statement_date.
    Se implementa como propiedad. Para filtrado/indexación SQL directa,
    añadir campo date=DateField(editable=False) y populate en save().
    """
    ENTRY_TYPE_CHOICES = [
        ('credit', _('Credit')),
        ('debit', _('Debit')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name=_('ID'))
    bank_statement_id = models.ForeignKey(
        'BankStatement',
        on_delete=models.PROTECT,
        related_name='transactions',
        verbose_name=_('Bank Statement')
    )
    current_reference = models.CharField(max_length=100, verbose_name=_('Current Reference'))
    original_reference = models.CharField(max_length=100, blank=True, null=True, verbose_name=_('Original Reference'))
    name = models.CharField(max_length=255, verbose_name=_('Name'))
    bank_account_id = models.ForeignKey(
        'bankaccounts.BankAccount',
        on_delete=models.PROTECT,
        related_name='statement_transactions',
        verbose_name=_('Bank Account')
    )
    office_code = models.CharField(max_length=50, blank=True, null=True, verbose_name=_('Office Code'))
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPE_CHOICES, verbose_name=_('Entry Type'))
    bank_fee = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Bank Fee'))
    amount = models.DecimalField(max_digits=20, decimal_places=4, verbose_name=_('Amount'))
    currency = models.CharField(max_length=3, verbose_name=_('Currency'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    class Meta:
        db_table = 'reconciliation_bankstatementtransaction'
        verbose_name = _('Bank Statement Transaction')
        verbose_name_plural = _('Bank Statement Transactions')
        ordering = ['-created_at', 'current_reference']
        indexes = [
            models.Index(fields=['bank_statement_id'], name='reconciliation_bst_stmt_idx'),
            models.Index(fields=['bank_account_id'], name='reconciliation_bst_account_idx'),
            models.Index(fields=['office_code'], name='reconciliation_bst_office_idx'),
            models.Index(fields=['entry_type'], name='reconciliation_bst_entrytype_idx'),
            models.Index(fields=['current_reference'], name='reconciliation_bst_current_ref_idx'),
            models.Index(fields=['original_reference'], name='reconciliation_bst_original_ref_idx'),
            models.Index(fields=['created_at'], name='reconciliation_bst_created_idx'),
        ]

    def __str__(self):
        return f"{self.current_reference} - {self.amount} {self.currency}"

    @property
    def date(self):
        """
        Retorna la fecha del extracto asociado.
        Para consultas SQL directas, usar bank_statement__statement_date.
        """
        return self.bank_statement.statement_date
