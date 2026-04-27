from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from apps.users.models import User, UserRole, Role
from apps.bank_accounts.models import BankAccount, Office, Operation


# Create your views here.
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        remember = request.POST.get('remember')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if remember:
                # Recordar por 3 horas (10800 segundos)
                request.session.set_expiry(10800)
            else:
                # Sesión hasta cerrar navegador
                request.session.set_expiry(0)
            return redirect('dashboard')
        else:
            messages.error(request, 'Credenciales incorrectas')
            return redirect('login')
    return render(request, 'users/login.html')

@login_required
def dashboard(request):
    context = {
        'current_page': 'dashboard'
    }
    return render(request, 'users/dashboard.html', context)

@login_required
def settings(request):
    context = {
        'current_page': 'settings'
    }
    return render(request, 'users/settings.html', context)

@login_required
def admin_panel(request):
    # Obtener todos los usuarios con información de roles
    users = User.objects.all().select_related()
    
    # Obtener roles para cada usuario
    user_roles = {}
    for ur in UserRole.objects.select_related('role').filter(user__in=users):
        if ur.user.id not in user_roles:
            user_roles[ur.user.id] = []
        user_roles[ur.user.id].append(ur.role.name)
    
    # Preparar lista de usuarios con roles
    users_with_roles = []
    for user in users:
        roles = user_roles.get(user.id, [])
        main_role = roles[0] if roles else 'Sin rol'
        users_with_roles.append({
            'user': user,
            'main_role': main_role,
            'roles': roles
        })
    
    # Estadísticas de usuarios
    total_users = users.count()
    active_users = users.filter(is_active=True).count()
    inactive_users = users.filter(is_active=False).count()
    admin_count = UserRole.objects.filter(role__name='Administrador').count()
    
    # Obtener operaciones
    operations = Operation.objects.all().order_by('code')
    active_operations = operations.count()
    
    # Obtener cuentas bancarias
    bank_accounts = BankAccount.objects.all().order_by('code')
    total_bank_accounts = bank_accounts.count()
    
    # Obtener oficinas
    offices = Office.objects.all().order_by('code')
    total_offices = offices.count()
    active_offices = offices.count()  # Se puede ajustar si hay campo de estado
    
    # Obtener roles disponibles
    roles_available = Role.objects.all()
    
    context = {
        'current_page': 'admin_panel',
        'users_with_roles': users_with_roles,
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': inactive_users,
        'admin_count': admin_count,
        'operations': operations,
        'active_operations': active_operations,
        'bank_accounts': bank_accounts,
        'total_bank_accounts': total_bank_accounts,
        'offices': offices,
        'total_offices': total_offices,
        'active_offices': active_offices,
        'roles_available': roles_available,
    }
    return render(request, 'users/admin_panel.html', context)

@login_required
@require_http_methods(["POST"])
def create_user(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        role_id = data.get('role_id')
        is_active = data.get('is_active', True)
        
        if not username or not password:
            return JsonResponse({'success': False, 'error': 'Username y password son requeridos'}, status=400)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'El username ya existe'}, status=400)
        
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=is_active
        )
        
        if role_id:
            role = get_object_or_404(Role, id=role_id)
            UserRole.objects.create(user=user, role=role)
        
        return JsonResponse({'success': True, 'message': 'Usuario creado exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def update_user(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        data = json.loads(request.body)
        
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.is_active = data.get('is_active', user.is_active)
        
        if data.get('password'):
            user.set_password(data.get('password'))
        
        user.save()
        
        if data.get('role_id'):
            role = get_object_or_404(Role, id=data.get('role_id'))
            UserRole.objects.filter(user=user).delete()
            UserRole.objects.create(user=user, role=role)
        
        return JsonResponse({'success': True, 'message': 'Usuario actualizado exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST", "DELETE"])
def delete_user(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        user.delete()
        return JsonResponse({'success': True, 'message': 'Usuario eliminado exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def create_operation(request):
    try:
        data = json.loads(request.body)
        code = data.get('code')
        name = data.get('name')
        description = data.get('description', '')
        
        if not code or not name:
            return JsonResponse({'success': False, 'error': 'Código y nombre son requeridos'}, status=400)
        
        if Operation.objects.filter(code=code).exists():
            return JsonResponse({'success': False, 'error': 'El código ya existe'}, status=400)
        
        Operation.objects.create(code=code, name=name, description=description)
        return JsonResponse({'success': True, 'message': 'Operación creada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def update_operation(request, operation_id):
    try:
        operation = get_object_or_404(Operation, id=operation_id)
        data = json.loads(request.body)
        
        operation.code = data.get('code', operation.code)
        operation.name = data.get('name', operation.name)
        operation.description = data.get('description', operation.description)
        operation.save()
        
        return JsonResponse({'success': True, 'message': 'Operación actualizada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST", "DELETE"])
def delete_operation(request, operation_id):
    try:
        operation = get_object_or_404(Operation, id=operation_id)
        operation.delete()
        return JsonResponse({'success': True, 'message': 'Operación eliminada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def create_bank_account(request):
    try:
        data = json.loads(request.body)
        code = data.get('code')
        name = data.get('name')
        
        if not code or not name:
            return JsonResponse({'success': False, 'error': 'Código y nombre son requeridos'}, status=400)
        
        if BankAccount.objects.filter(code=code).exists():
            return JsonResponse({'success': False, 'error': 'El código ya existe'}, status=400)
        
        BankAccount.objects.create(code=code, name=name)
        return JsonResponse({'success': True, 'message': 'Cuenta bancaria creada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def update_bank_account(request, account_id):
    try:
        account = get_object_or_404(BankAccount, id=account_id)
        data = json.loads(request.body)
        
        account.code = data.get('code', account.code)
        account.name = data.get('name', account.name)
        account.save()
        
        return JsonResponse({'success': True, 'message': 'Cuenta bancaria actualizada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST", "DELETE"])
def delete_bank_account(request, account_id):
    try:
        account = get_object_or_404(BankAccount, id=account_id)
        account.delete()
        return JsonResponse({'success': True, 'message': 'Cuenta bancaria eliminada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def create_office(request):
    try:
        data = json.loads(request.body)
        code = data.get('code')
        name = data.get('name')
        
        if not code or not name:
            return JsonResponse({'success': False, 'error': 'Código y nombre son requeridos'}, status=400)
        
        if Office.objects.filter(code=code).exists():
            return JsonResponse({'success': False, 'error': 'El código ya existe'}, status=400)
        
        Office.objects.create(code=code, name=name)
        return JsonResponse({'success': True, 'message': 'Oficina creada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def update_office(request, office_id):
    try:
        office = get_object_or_404(Office, id=office_id)
        data = json.loads(request.body)
        
        office.code = data.get('code', office.code)
        office.name = data.get('name', office.name)
        office.save()
        
        return JsonResponse({'success': True, 'message': 'Oficina actualizada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST", "DELETE"])
def delete_office(request, office_id):
    try:
        office = get_object_or_404(Office, id=office_id)
        office.delete()
        return JsonResponse({'success': True, 'message': 'Oficina eliminada exitosamente'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
def logout_view(request):
    logout(request)
    return redirect('login')