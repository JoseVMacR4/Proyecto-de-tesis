from django.contrib import admin
from .models import (
    CodeCatalog, Office, Bank, BankAccount, Operation,
    AccountState, SystemSetting, Report, ReportRun
)


@admin.register(CodeCatalog)
class CodeCatalogAdmin(admin.ModelAdmin):
    list_display = ('code', 'category', 'display_name', 'description', 'created_at')
    list_filter = ('category',)
    search_fields = ('code', 'display_name', 'description')
    ordering = ('category', 'code')


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'created_at')
    search_fields = ('code', 'name')
    ordering = ('code',)


@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
    list_display = ('name', 'swift_code', 'country', 'created_at')
    search_fields = ('name', 'swift_code', 'country')
    ordering = ('name',)


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'bank', 'created_at')
    list_filter = ('bank',)
    search_fields = ('code', 'name')
    ordering = ('code',)


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'created_at')
    search_fields = ('code', 'name')
    ordering = ('code',)


@admin.register(AccountState)
class AccountStateAdmin(admin.ModelAdmin):
    list_display = ('bank_account', 'period_start', 'period_end', 'balance', 'reconciled_at')
    list_filter = ('bank_account', 'reconciled_at')
    search_fields = ('bank_account__code',)
    ordering = ('-period_end',)


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'updated_at')
    search_fields = ('key',)
    ordering = ('key',)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'created_by', 'created_at')
    list_filter = ('type',)
    search_fields = ('name', 'created_by__username')
    ordering = ('name',)


@admin.register(ReportRun)
class ReportRunAdmin(admin.ModelAdmin):
    list_display = ('report', 'run_at', 'status', 'generated_at', 'result_location')
    list_filter = ('status', 'report')
    search_fields = ('report__name',)
    ordering = ('-run_at',)