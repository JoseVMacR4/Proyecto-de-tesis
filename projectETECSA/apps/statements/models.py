import uuid
from django.db import models
from apps.bank_accounts.models import BankAccount, Office


class BankStatement(models.Model):
    """
    Extractos bancarios cargados al sistema
    - La fecha se extrae del documento
    - Las transacciones heredan la fecha del extracto
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name='statements'
    )
    file_name = models.CharField(max_length=255)
    file_extension = models.CharField(max_length=10)
    statement_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    starting_balance = models.DecimalField(max_digits=20, decimal_places=4)
    ending_balance = models.DecimalField(max_digits=20, decimal_places=4)
    overdraft_balance = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    reserved_balance = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    available_balance = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    entry_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bank_statements'
        verbose_name = 'Extracto Bancario'
        verbose_name_plural = 'Extractos Bancarios'
        ordering = ['-statement_date', 'bank_account']
        indexes = [
            models.Index(fields=['statement_date']),
            models.Index(fields=['period_start']),
            models.Index(fields=['period_end']),
            models.Index(fields=['bank_account']),
        ]
    
    def __str__(self):
        return f"{self.bank_account.code} - {self.statement_date}"


class BankStatementTransaction(models.Model):
    """
    Transacciones de extractos bancarios
    - Hereda date del BankStatement (no es campo propio)
    - office_code referencia a Office.code para decodificación
    """
    ENTRY_TYPE_CHOICES = [
        ('credit', 'Crédito'),
        ('debit', 'Débito'),
    ]
    
    CURRENCY_CHOICES = [
        ('CUP', 'Peso Cubano'),
        ('USD', 'Dólar Estadounidense'),
        ('EUR', 'Euro'),
        ('MXN', 'Peso Mexicano'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank_statement = models.ForeignKey(
        BankStatement,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    current_reference = models.CharField(max_length=100, db_index=True)
    original_reference = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=255)
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name='statement_transactions'
    )
    office_code = models.CharField(max_length=50, db_index=True, help_text='Código de oficina para decodificación')
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES)
    bank_fee = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    amount = models.DecimalField(max_digits=20, decimal_places=4)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='CUP')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bank_statement_transactions'
        verbose_name = 'Transacción de Extracto'
        verbose_name_plural = 'Transacciones de Extractos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['current_reference']),
            models.Index(fields=['office_code']),
            models.Index(fields=['entry_type']),
            models.Index(fields=['bank_statement']),
        ]
    
    def __str__(self):
        return f"{self.current_reference} - {self.name} ({self.amount} {self.currency})"
    
    @property
    def date(self):
        """Propiedad que devuelve la fecha del extracto padre"""
        return self.bank_statement.statement_date if self.bank_statement else None
