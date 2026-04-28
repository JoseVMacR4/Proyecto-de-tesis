import uuid
import os
from django.db import models
from django.utils.translation import gettext_lazy as _


def bank_statement_file_path(instance, filename):
    """
    Generate file path for bank statements.
    Structure: estados_cuentas/{bank_id}/{bank_id}_{date_ddmmyyyy}_{internal_id}.{ext}
    """
    ext = os.path.splitext(filename)[1][1:]  # Get extension without dot
    date_str = instance.statement_date.strftime('%d%m%Y')
    bank_id = str(instance.bank_account.id)[:8]  # Use first 8 chars of UUID
    internal_id = str(instance.internal_id) if instance.internal_id else str(instance.id)[:8]
    new_filename = f"{bank_id}_{date_str}_{internal_id}.{ext}"
    return os.path.join('estados_cuentas', bank_id, new_filename)


class BankStatement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    internal_id = models.CharField(max_length=50, unique=True, editable=False)
    bank_account = models.ForeignKey(
        'bank_accounts.BankAccount',
        on_delete=models.PROTECT,
        related_name='bank_statements',
    )
    file_name = models.CharField(max_length=255)
    file_extension = models.CharField(max_length=10)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    statement_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    starting_balance = models.DecimalField(max_digits=20, decimal_places=4)
    ending_balance = models.DecimalField(max_digits=20, decimal_places=4)
    overdraft_balance = models.DecimalField(max_digits=20, decimal_places=4)
    reserved_balance = models.DecimalField(max_digits=20, decimal_places=4)
    available_balance = models.DecimalField(max_digits=20, decimal_places=4)
    entry_count = models.IntegerField()
    status = models.CharField(
        max_length=50,
        default='uploaded',
        choices=[
            ('uploaded', 'Subido'),
            ('processing', 'Procesando'),
            ('completed', 'Completado'),
            ('error', 'Error'),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Bank Statement')
        verbose_name_plural = _('Bank Statements')
        ordering = ['-statement_date']
        indexes = [
            models.Index(fields=['statement_date']),
            models.Index(fields=['bank_account']),
            models.Index(fields=['status']),
            models.Index(fields=['bank_account', 'statement_date'], name='bank_acc_stmt_date_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['bank_account', 'statement_date'],
                name='unique_bank_statement_per_day'
            )
        ]

    def __str__(self):
        return f"{self.bank_account.code} - {self.statement_date.isoformat()} - {self.internal_id}"
    
    def save(self, *args, **kwargs):
        if not self.internal_id:
            # Generate internal ID from UUID (first 8 characters)
            self.internal_id = str(self.id)[:8].upper()
        super().save(*args, **kwargs)


class BankStatementTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_statement = models.ForeignKey(
        'reconciliation.BankStatement',
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    current_reference = models.CharField(max_length=255)
    original_reference = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255)
    bank_account = models.ForeignKey(
        'bank_accounts.BankAccount',
        on_delete=models.PROTECT,
        related_name='statement_transactions',
    )
    office_code = models.CharField(max_length=50, blank=True, null=True)
    entry_type = models.CharField(max_length=50)
    bank_fee = models.DecimalField(max_digits=20, decimal_places=4)
    amount = models.DecimalField(max_digits=20, decimal_places=4)
    currency = models.CharField(max_length=3)
    date = models.DateField(editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Bank Statement Transaction')
        verbose_name_plural = _('Bank Statement Transactions')
        ordering = ['-bank_statement__statement_date', 'current_reference']
        indexes = [
            models.Index(fields=['current_reference']),
            models.Index(fields=['bank_statement']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.current_reference} - {self.name}"

    @property
    def transaction_date(self):
        return self.bank_statement.statement_date

    def save(self, *args, **kwargs):
        self.date = self.bank_statement.statement_date
        super().save(*args, **kwargs)
