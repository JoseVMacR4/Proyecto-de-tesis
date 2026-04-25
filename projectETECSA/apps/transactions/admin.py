from django.contrib import admin
from .models import BankStatement, BankStatementTransaction


@admin.register(BankStatement)
class BankStatementAdmin(admin.ModelAdmin):
    list_display = (
        'bank_account', 'statement_date', 'period_start', 'period_end',
        'starting_balance', 'ending_balance', 'available_balance', 'entry_count'
    )
    list_filter = ('bank_account', 'statement_date')
    search_fields = ('bank_account__code', 'bank_account__name', 'file_name')
    ordering = ('-statement_date',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información principal', {
            'fields': ('bank_account', 'file_name', 'file_extension', 'statement_date')
        }),
        ('Período', {
            'fields': ('period_start', 'period_end')
        }),
        ('Balances', {
            'fields': (
                'starting_balance', 'ending_balance', 'overdraft_balance',
                'reserved_balance', 'available_balance', 'entry_count'
            )
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BankStatementTransaction)
class BankStatementTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'current_reference', 'name', 'bank_account', 'office_code',
        'entry_type', 'amount', 'bank_fee', 'currency', 'created_at'
    )
    list_filter = ('entry_type', 'currency', 'bank_statement', 'office_code')
    search_fields = ('current_reference', 'original_reference', 'name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Referencias', {
            'fields': ('current_reference', 'original_reference', 'name')
        }),
        ('Cuentas', {
            'fields': ('bank_statement', 'bank_account', 'office_code')
        }),
        ('Detalles financieros', {
            'fields': ('entry_type', 'amount', 'bank_fee', 'currency')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )