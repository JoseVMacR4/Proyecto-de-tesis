from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('settings/', views.settings, name='settings'),
    path('admin-panel/', views.admin_panel, name='admin_panel'),
    path('logout/', views.logout_view, name='logout'),
    
    # CRUD Usuarios
    path('admin-panel/users/create/', views.create_user, name='create_user'),
    path('admin-panel/users/<uuid:user_id>/update/', views.update_user, name='update_user'),
    path('admin-panel/users/<uuid:user_id>/delete/', views.delete_user, name='delete_user'),
    path('admin-panel/users/list/', views.get_users, name='get_users'),
    
    # CRUD Operaciones
    path('admin-panel/operations/create/', views.create_operation, name='create_operation'),
    path('admin-panel/operations/<uuid:operation_id>/update/', views.update_operation, name='update_operation'),
    path('admin-panel/operations/<uuid:operation_id>/delete/', views.delete_operation, name='delete_operation'),
    path('admin-panel/operations/list/', views.get_operations, name='get_operations'),
    
    # CRUD Cuentas Bancarias
    path('admin-panel/bank-accounts/create/', views.create_bank_account, name='create_bank_account'),
    path('admin-panel/bank-accounts/<uuid:account_id>/update/', views.update_bank_account, name='update_bank_account'),
    path('admin-panel/bank-accounts/<uuid:account_id>/delete/', views.delete_bank_account, name='delete_bank_account'),
    path('admin-panel/bank-accounts/list/', views.get_bank_accounts, name='get_bank_accounts'),
    
    # CRUD Oficinas
    path('admin-panel/offices/create/', views.create_office, name='create_office'),
    path('admin-panel/offices/<uuid:office_id>/update/', views.update_office, name='update_office'),
    path('admin-panel/offices/<uuid:office_id>/delete/', views.delete_office, name='delete_office'),
    path('admin-panel/offices/list/', views.get_offices, name='get_offices'),
]