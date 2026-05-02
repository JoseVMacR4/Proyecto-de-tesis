from django.urls import path
from . import views

urlpatterns = [
    path('', views.bank_accounts, name='bank_accounts'),
    path('api/upload-statement/', views.upload_statement_api, name='upload_statement_api'),
    path('api/bank-statements/<path:statement_file>/download/', views.download_statement, name='download_statement'),
    path('api/bank-statements/<path:statement_file>/', views.get_statement_detail, name='get_statement_detail'),
]