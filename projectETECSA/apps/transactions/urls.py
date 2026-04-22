from django.urls import path
from . import views

urlpatterns = [
    path('', views.inicio, name='transactions'),
    path('inicio/', views.inicio, name='inicio'),
]