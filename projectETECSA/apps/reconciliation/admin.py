from django.contrib import admin
from .models import Bank, BankTransaction, ReconciliationLog

# Register your models here.

@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
	list_display = ('code', 'name', 'short_code')
	search_fields = ('name', 'code')
	ordering = ('name',)


@admin.register(BankTransaction)
class BankTransactionAdmin(admin.ModelAdmin):
	list_display = ('reference', 'bank', 'entity', 'amount', 'transaction_date', 'status')
	list_filter = ('status', 'bank', 'transaction_date', 'created_at')
	search_fields = ('reference', 'entity')
	readonly_fields = ('created_at', 'updated_at')
	
	fieldsets = (
		('Información de Transacción', {
			'fields': ('reference', 'bank', 'entity', 'amount', 'transaction_date')
		}),
		('Estado', {
			'fields': ('status', 'notes')
		}),
		('Metadatos', {
			'fields': ('created_at', 'updated_at'),
			'classes': ('collapse',)
		}),
	)
	
	ordering = ('-transaction_date', '-created_at')


@admin.register(ReconciliationLog)
class ReconciliationLogAdmin(admin.ModelAdmin):
	list_display = ('transaction', 'action', 'performed_by', 'performed_at')
	list_filter = ('action', 'performed_at')
	search_fields = ('transaction__reference', 'performed_by')
	readonly_fields = ('performed_at',)
	
	fieldsets = (
		('Información', {
			'fields': ('transaction', 'action', 'performed_by')
		}),
		('Detalles', {
			'fields': ('description', 'performed_at')
		}),
	)
	
	ordering = ('-performed_at',)
