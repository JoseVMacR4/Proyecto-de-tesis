from django.db import models

# Create your models here.

class Bank(models.Model):
	"""Modelo para bancos"""
	BANK_CHOICES = [
		('BM', 'Banco Metropolitano'),
		('BC', 'BANDEC'),
		('BP', 'BPA'),
	]
	
	code = models.CharField(max_length=10, unique=True)
	name = models.CharField(max_length=100)
	short_code = models.CharField(max_length=5, choices=BANK_CHOICES)
	
	class Meta:
		verbose_name = "Banco"
		verbose_name_plural = "Bancos"
	
	def __str__(self):
		return self.name


class BankTransaction(models.Model):
	"""Modelo para transacciones bancarias"""
	STATUS_CHOICES = [
		('pending', 'Pending'),
		('matched', 'Matched'),
		('flagged', 'Flagged'),
		('rejected', 'Rejected'),
	]
	
	reference = models.CharField(max_length=50, unique=True, db_index=True)
	bank = models.ForeignKey(Bank, on_delete=models.PROTECT, related_name='transactions')
	entity = models.CharField(max_length=200)
	amount = models.DecimalField(max_digits=15, decimal_places=2)
	transaction_date = models.DateField()
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
	notes = models.TextField(blank=True, null=True)
	
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	
	class Meta:
		verbose_name = "Transacción Bancaria"
		verbose_name_plural = "Transacciones Bancarias"
		ordering = ['-transaction_date', '-created_at']
		indexes = [
			models.Index(fields=['transaction_date']),
			models.Index(fields=['status']),
			models.Index(fields=['bank']),
		]
	
	def __str__(self):
		return f"{self.reference} - {self.entity} ({self.amount})"


class ReconciliationLog(models.Model):
	"""Registro de acciones de conciliación"""
	ACTION_CHOICES = [
		('created', 'Creada'),
		('matched', 'Conciliada'),
		('reviewed', 'Revisada'),
		('flagged', 'Marcada'),
		('resolved', 'Resuelta'),
	]
	
	transaction = models.ForeignKey(BankTransaction, on_delete=models.CASCADE, related_name='reconciliation_logs')
	action = models.CharField(max_length=20, choices=ACTION_CHOICES)
	description = models.TextField(blank=True)
	performed_by = models.CharField(max_length=100, blank=True)
	performed_at = models.DateTimeField(auto_now_add=True)
	
	class Meta:
		verbose_name = "Log de Conciliación"
		verbose_name_plural = "Logs de Conciliación"
		ordering = ['-performed_at']
	
	def __str__(self):
		return f"{self.transaction.reference} - {self.action} ({self.performed_at.strftime('%Y-%m-%d')})"
