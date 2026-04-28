from django.urls import path
from . import views

urlpatterns = [
    path('', views.bank_accounts, name='bank_accounts'),
    
    # APIs
    path('api/upload/', views.upload_bank_statement, name='api_upload_bank_statement'),
]