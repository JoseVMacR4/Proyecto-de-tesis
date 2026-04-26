import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class BankStatement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_account = models.ForeignKey(
        'bank_accounts.BankAccount',
        on_delete=models.PROTECT,
        related_name='bank_statements',
    )
    file_name = models.CharField(max_length=255)
    file_extension = models.CharField(max_length=10)
    statement_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    starting_balance = models.DecimalField(max_digits=20, decimal_places=4)
    ending_balance = models.DecimalField(max_digits=20, decimal_places=4)
    overdraft_balance = models.DecimalField(max_digits=20, decimal_places=4)
    reserved_balance = models.DecimalField(max_digits=20, decimal_places=4)
    available_balance = models.DecimalField(max_digits=20, decimal_places=4)
    entry_count = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Bank Statement')
        verbose_name_plural = _('Bank Statements')
        ordering = ['-statement_date']
        indexes = [
            models.Index(fields=['statement_date']),
            models.Index(fields=['bank_account']),
        ]

    def __str__(self):
        return f"{self.bank_account.code} - {self.statement_date.isoformat()}"


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
