from django.contrib import admin
from .models import BankStatement, BankStatementTransaction

@admin.register(BankStatement)
class BankStatementAdmin(admin.ModelAdmin):
    list_display = (
        'bank_account',
        'statement_date',
        'starting_balance',
        'ending_balance',
        'entry_count',
    )
    list_filter = ('statement_date', 'bank_account')
    search_fields = ('file_name', 'bank_account__code')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-statement_date',)


@admin.register(BankStatementTransaction)
class BankStatementTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'current_reference',
        'bank_statement',
        'bank_account',
        'amount',
        'currency',
        'date',
    )
    list_filter = ('currency', 'bank_account', 'date')
    search_fields = ('current_reference', 'original_reference', 'name')
    readonly_fields = ('created_at', 'updated_at', 'date')
    ordering = ('-date', 'current_reference')
