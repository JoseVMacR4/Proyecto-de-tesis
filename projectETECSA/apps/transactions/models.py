import uuid
from django.db import models


class BankStatement(models.Model):
    """Modelo para estados de cuenta bancarios"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_account = models.ForeignKey('bank_accounts.BankAccount', on_delete=models.CASCADE, related_name='bank_statements')
    file_name = models.CharField(max_length=255)
    file_extension = models.CharField(max_length=10)
    statement_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    starting_balance = models.DecimalField(max_digits=20, decimal_places=4)
    ending_balance = models.DecimalField(max_digits=20, decimal_places=4)
    overdraft_balance = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    reserved_balance = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    available_balance = models.DecimalField(max_digits=20, decimal_places=4)
    entry_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Estado de Cuenta Bancario"
        verbose_name_plural = "Estados de Cuenta Bancarios"
        db_table = 'bank_statements'
        ordering = ['-statement_date']
        indexes = [
            models.Index(fields=['bank_account', 'statement_date']),
            models.Index(fields=['period_start', 'period_end']),
        ]
    
    def __str__(self):
        return f"{self.bank_account.code} - {self.statement_date}"


class BankStatementTransaction(models.Model):
    """Modelo para transacciones dentro de un estado de cuenta bancario"""
    ENTRY_TYPE_CHOICES = [
        ('credit', 'Crédito'),
        ('debit', 'Débito'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name='transactions')
    current_reference = models.CharField(max_length=100)
    original_reference = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=255)
    bank_account = models.ForeignKey('bank_accounts.BankAccount', on_delete=models.CASCADE, related_name='statement_transactions')
    office_code = models.CharField(max_length=50, db_index=True)
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES)
    bank_fee = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    amount = models.DecimalField(max_digits=20, decimal_places=4)
    currency = models.CharField(max_length=3, default='CUP')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Transacción de Estado de Cuenta"
        verbose_name_plural = "Transacciones de Estados de Cuenta"
        db_table = 'bank_statement_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['bank_statement']),
            models.Index(fields=['office_code']),
            models.Index(fields=['current_reference']),
        ]
    
    def __str__(self):
        return f"{self.current_reference} - {self.name} ({self.amount})"