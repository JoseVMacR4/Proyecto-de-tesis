from django.urls import path
from . import views

urlpatterns = [
    path('', views.bank_accounts, name='bank_accounts'),
]