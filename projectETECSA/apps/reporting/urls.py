from django.urls import path
from . import views

urlpatterns = [
    path('', views.reporting_view, name='reporting'),
    path('api/conciliation-trend/', views.conciliation_trend, name='conciliation_trend'),
    path('api/status-distribution/', views.status_distribution, name='status_distribution'),
    path('api/income-expense/', views.income_expense, name='income_expense'),
    path('api/top-operations/', views.top_operations, name='top_operations'),
    path('api/account-volume/', views.account_volume, name='account_volume'),
    path('api/fees-evolution/', views.fees_evolution, name='fees_evolution'),
]