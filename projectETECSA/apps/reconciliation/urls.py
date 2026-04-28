from django.urls import path
from . import views

urlpatterns = [
    # Vista principal de reconciliación
    path('', views.reconciliation_view, name='reconciliation'),
    
    # APIs para estados de cuenta
    path('api/upload/', views.upload_bank_statements, name='api_upload_statements'),
    path('api/history/', views.get_statement_history, name='api_statement_history'),
    path('api/file/<uuid:statement_id>/', views.get_statement_file, name='api_statement_file'),
    
    # APIs de conciliación
    path('api/data/', views.get_reconciliation_data, name='api_reconciliation_data'),
    path('api/reconcile/', views.reconcile_transaction, name='api_reconcile_transaction'),
    path('api/export/', views.export_reconciliation, name='api_export_reconciliation'),
]