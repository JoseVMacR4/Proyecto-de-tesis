from django.urls import path
from . import views

urlpatterns = [
    # Vista principal de reconciliación
    path('', views.reconciliation_view, name='reconciliation'),
    path('dashboard/', views.reconciliation_view, name='reconciliation_dashboard'),
    
    # APIs
    path('api/data/', views.get_reconciliation_data, name='api_reconciliation_data'),
    path('api/reconcile/', views.reconcile_transaction, name='api_reconcile_transaction'),
    path('api/export/', views.export_reconciliation, name='api_export_reconciliation'),
]