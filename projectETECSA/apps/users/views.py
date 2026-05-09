from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import ProtectedError, Case, When, Value, IntegerField
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from apps.users.models import User, UserRole, Role, UserActivity, BugReport
from apps.users.permissions import can_access_admin
from apps.bank_accounts.models import BankAccount, Office, Operation
from django.utils import timezone
from django.utils.formats import date_format
from django.views.decorators.http import require_GET, require_POST
from .models import Notification

DEFAULT_USER_ROLES = [
    'Administrador',
    'Analista Económico',
    'Analista Comercial',
    'Analista Financiero',
]

def ensure_default_roles():
    if not Role.objects.exists():
        for role_name in DEFAULT_USER_ROLES:
            Role.objects.get_or_create(name=role_name)

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        remember = request.POST.get('remember')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if remember:
                request.session.set_expiry(10800)
            else:
                request.session.set_expiry(0)

            UserActivity.objects.create(
                user=user,
                action=UserActivity.ActionType.LOGIN,
                description=f'Inicio de sesión en el sistema',
            )

            return redirect('dashboard')
        else:
            messages.error(request, 'Credenciales incorrectas')
            return redirect('login')
    return render(request, 'users/login.html')

@login_required
def dashboard(request):
    from apps.reconciliation.models import BankStatement, BankStatementTransaction
    from apps.bank_accounts.models import BankAccount

    last_statement = BankStatement.objects.order_by('-statement_date').first()
    last_account_stmt = BankStatement.objects.select_related('bank_account').order_by('-created_at').first()

    if last_statement:
        total_balance = sum(
            bs.ending_balance for bs in BankStatement.objects.all()
        )
        available_balance = sum(
            bs.available_balance for bs in BankStatement.objects.all()
        )
        reserved_balance = sum(
            bs.reserved_balance for bs in BankStatement.objects.all()
        )
        overdraft_balance = sum(
            bs.overdraft_balance for bs in BankStatement.objects.all()
        )
        total_transactions = sum(
            bs.entry_count for bs in BankStatement.objects.all()
        )
        last_update_date = date_format(last_statement.statement_date, 'M d, Y')
        last_update_time = date_format(last_statement.created_at, 'H:i')
    else:
        total_balance = 0
        available_balance = 0
        reserved_balance = 0
        overdraft_balance = 0
        total_transactions = 0
        last_update_date = 'Sin datos'
        last_update_time = ''

    active_accounts = BankAccount.objects.count()

    if last_account_stmt:
        last_account_date = last_account_stmt.statement_date.strftime('%b %d, %Y')
        last_account_name = last_account_stmt.bank_account.name
        last_account_starting = last_account_stmt.starting_balance
        last_account_ending = last_account_stmt.ending_balance
        last_account_entries = last_account_stmt.entry_count
        last_account_load_date = date_format(last_account_stmt.created_at, 'M d, Y')
        last_account_load_time = date_format(last_account_stmt.created_at, 'H:i')
    else:
        last_account_date = 'Sin datos'
        last_account_name = ''
        last_account_starting = 0
        last_account_ending = 0
        last_account_entries = 0
        last_account_load_date = ''
        last_account_load_time = ''

    total_reconciled = BankStatementTransaction.objects.filter(
        status=BankStatementTransaction.StatusChoices.RECONCILED
    ).count()

    total_pending = BankStatementTransaction.objects.filter(
        status=BankStatementTransaction.StatusChoices.PENDING
    ).count()

    total_bank_accounts = BankAccount.objects.count()
    total_offices = Office.objects.count()
    total_operations = Operation.objects.count()

    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    inactive_users = User.objects.filter(is_active=False).count()

    context = {
        'current_page': 'dashboard',
        'total_balance': total_balance,
        'available_balance': available_balance,
        'reserved_balance': reserved_balance,
        'overdraft_balance': overdraft_balance,
        'total_transactions': total_transactions,
        'active_accounts': active_accounts,
        'last_update_date': last_update_date,
        'last_update_time': last_update_time,
        'last_account_date': last_account_date,
        'last_account_name': last_account_name,
        'last_account_starting': last_account_starting,
        'last_account_ending': last_account_ending,
        'last_account_entries': last_account_entries,
        'last_account_load_date': last_account_load_date,
        'last_account_load_time': last_account_load_time,
        'total_reconciled': total_reconciled,
        'total_pending': total_pending,
        'recent_reports': [
            {
                'name': bug.subject,
                'type': bug.type,
                'type_name': bug.get_type_display(),
                'date': date_format(bug.updated_at, 'M d, Y'),
                'status': bug.get_status_display(),
            }
            for bug in BugReport.objects.filter(
                status=BugReport.StatusType.RESOLVED
            ).order_by('-updated_at')[:3]
        ],
        'total_bank_accounts': total_bank_accounts,
        'total_offices': total_offices,
        'total_operations': total_operations,
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': inactive_users,
    }
    return render(request, 'users/dashboard.html', context)

@login_required
def settings(request):
    user = request.user
    
    user_roles = UserRole.objects.filter(user=user).select_related('role')
    roles = [ur.role.name for ur in user_roles]
    main_role = roles[0] if roles else 'Sin rol'
    
    context = {
        'current_page': 'settings',
        'profile_user': user,
        'profile_role': main_role,
        'profile_roles': roles,
    }
    return render(request, 'users/settings.html', context)

@login_required
def admin_panel(request):
    if not can_access_admin(request.user):
        return redirect('dashboard')
    
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
    ensure_default_roles()
    roles_available = Role.objects.all()
    
    context = {
        'current_page': 'admin_panel',
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
        'current_user_id': request.user.id,
    }
    return render(request, 'users/admin_panel.html', context)

@csrf_exempt
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

        Notification.objects.create(
            user=request.user,
            type='success',
            content=f"Usuario '{username}' creado exitosamente."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.CREATE_USER,
            description=f"Usuario '{username}' creado",
            metadata={'user_id': str(user.id), 'role': role.name if role_id else None}
        )

        return JsonResponse({'success': True, 'message': 'Usuario creado exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'email' in error_msg.lower():
                error_msg = 'El email ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al crear usuario: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
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
        
        if data.get('role_id') is not None:
            UserRole.objects.filter(user=user).delete()
            if data.get('role_id'):
                role = get_object_or_404(Role, id=data.get('role_id'))
                UserRole.objects.create(user=user, role=role)

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.UPDATE_USER,
            description=f"Usuario '{user.username}' actualizado",
            metadata={'user_id': str(user_id)}
        )
        
        return JsonResponse({'success': True, 'message': 'Usuario actualizado exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'email' in error_msg.lower():
                error_msg = 'El email ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al actualizar usuario: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST", "DELETE"])
def delete_user(request, user_id):
    if not can_access_admin(request.user):
        return JsonResponse({'success': False, 'error': 'Sin permisos'}, status=403)
    try:
        user = get_object_or_404(User, id=user_id)
        username = user.username
        user.delete()

        Notification.objects.create(
            user=request.user,
            type='warning',
            content=f"Usuario '{username}' eliminado."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.DELETE_USER,
            description=f"Usuario '{username}' eliminado",
            metadata={'deleted_user_id': str(user_id)}
        )

        return JsonResponse({'success': True, 'message': 'Usuario eliminado exitosamente'})
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al eliminar usuario: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def create_operation(request):
    try:
        data = json.loads(request.body)
        code = data.get('code')
        name = data.get('name')
        
        if not code or not name:
            return JsonResponse({'success': False, 'error': 'Código y nombre son requeridos'}, status=400)
        
        if Operation.objects.filter(code=code).exists():
            return JsonResponse({'success': False, 'error': 'El código ya existe'}, status=400)
        
        Operation.objects.create(code=code, name=name)

        Notification.objects.create(
            user=request.user,
            type='success',
            content=f"Operación '{code} - {name}' creada."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.CREATE_OPERATION,
            description=f"Operación '{code} - {name}' creada",
            metadata={'operation_code': code, 'operation_name': name}
        )

        return JsonResponse({'success': True, 'message': 'Operación creada exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'code' in error_msg.lower():
                error_msg = 'El código ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al crear operación: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_operation(request, operation_id):
    try:
        operation = get_object_or_404(Operation, id=operation_id)
        data = json.loads(request.body)
        
        operation.code = data.get('code', operation.code)
        operation.name = data.get('name', operation.name)
        operation.save()

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.UPDATE_OPERATION,
            description=f"Operación '{operation.code}' actualizada",
            metadata={'operation_id': str(operation_id)}
        )
        
        return JsonResponse({'success': True, 'message': 'Operación actualizada exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'code' in error_msg.lower():
                error_msg = 'El código ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al actualizar operación: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST", "DELETE"])
def delete_operation(request, operation_id):
    if not can_access_admin(request.user):
        return JsonResponse({'success': False, 'error': 'Sin permisos'}, status=403)
    try:
        operation = get_object_or_404(Operation, id=operation_id)
        op_code = operation.code
        operation.delete()

        Notification.objects.create(
            user=request.user,
            type='warning',
            content=f"Operación '{op_code}' eliminada."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.DELETE_OPERATION,
            description=f"Operación '{op_code}' eliminada",
            metadata={'deleted_operation_id': str(operation_id)}
        )

        return JsonResponse({'success': True, 'message': 'Operación eliminada exitosamente'})
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al eliminar operación: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_operations(request):
    try:
        operations = Operation.objects.all().order_by('code')
        
        operations_data = []
        for op in operations:
            operations_data.append({
                'id': str(op.id),
                'code': op.code,
                'name': op.name
            })
        
        stats = {
            'total_operations': operations.count(),
            'active_operations': operations.count()  # Asumiendo todas activas
        }
        
        return JsonResponse({
            'success': True,
            'operations': operations_data,
            'stats': stats
})
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al obtener reportes: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
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

        Notification.objects.create(
            user=request.user,
            type='success',
            content=f"Cuenta bancaria '{code} - {name}' creada."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.CREATE_BANK,
            description=f"Cuenta bancaria '{code} - {name}' creada",
            metadata={'bank_code': code, 'bank_name': name}
        )

        return JsonResponse({'success': True, 'message': 'Cuenta bancaria creada exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'code' in error_msg.lower():
                error_msg = 'El código ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al crear cuenta bancaria: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_bank_account(request, account_id):
    try:
        account = get_object_or_404(BankAccount, id=account_id)
        data = json.loads(request.body)
        
        account.code = data.get('code', account.code)
        account.name = data.get('name', account.name)
        account.save()

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.UPDATE_BANK,
            description=f"Cuenta bancaria '{account.code}' actualizada",
            metadata={'account_id': str(account_id), 'old_code': account.code}
        )
        
        return JsonResponse({'success': True, 'message': 'Cuenta bancaria actualizada exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'code' in error_msg.lower():
                error_msg = 'El código ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al actualizar cuenta bancaria: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST", "DELETE"])
def delete_bank_account(request, account_id):
    if not can_access_admin(request.user):
        return JsonResponse({'success': False, 'error': 'Sin permisos'}, status=403)
    try:
        account = get_object_or_404(BankAccount, id=account_id)
        acc_code = account.code
        account.delete()

        Notification.objects.create(
            user=request.user,
            type='warning',
            content=f"Cuenta bancaria '{acc_code}' eliminada."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.DELETE_BANK,
            description=f"Cuenta bancaria '{acc_code}' eliminada",
            metadata={'deleted_account_id': str(account_id)}
        )

        return JsonResponse({'success': True, 'message': 'Cuenta bancaria eliminada exitosamente'})
    except ProtectedError:
        Notification.objects.create(user=request.user, type='error', content="No se puede eliminar cuenta bancaria: está asociada a transacciones")
        return JsonResponse({
            'success': False,
            'error': 'No se puede eliminar porque está asociado a transacciones.'
        }, status=400)
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al eliminar cuenta bancaria: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_bank_accounts(request):
    try:
        banks = BankAccount.objects.all().order_by('code')
        
        banks_data = []
        for bank in banks:
            banks_data.append({
                'id': str(bank.id),
                'code': bank.code,
                'name': bank.name
            })
        
        stats = {
            'total_banks': banks.count(),
            'active_banks': banks.count()  # Asumiendo todas activas
        }
        
        return JsonResponse({
            'success': True,
            'banks': banks_data,
            'stats': stats
        })
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al obtener cuentas bancarias: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
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

        Notification.objects.create(
            user=request.user,
            type='success',
            content=f"Oficina '{code} - {name}' creada."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.CREATE_OFFICE,
            description=f"Oficina '{code} - {name}' creada",
            metadata={'office_code': code, 'office_name': name}
        )

        return JsonResponse({'success': True, 'message': 'Oficina creada exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'code' in error_msg.lower():
                error_msg = 'El código ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al crear oficina: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_office(request, office_id):
    try:
        office = get_object_or_404(Office, id=office_id)
        data = json.loads(request.body)
        
        office.code = data.get('code', office.code)
        office.name = data.get('name', office.name)
        office.save()

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.UPDATE_OFFICE,
            description=f"Oficina '{office.code}' actualizada",
            metadata={'office_id': str(office_id)}
        )
        
        return JsonResponse({'success': True, 'message': 'Oficina actualizada exitosamente'})
    except Exception as e:
        error_msg = str(e)
        if 'llave duplicada' in error_msg or 'duplicate key' in error_msg or 'UNIQUE constraint' in error_msg:
            if 'code' in error_msg.lower():
                error_msg = 'El código ya existe'
            else:
                error_msg = 'Ya existe un registro con estos datos'
        Notification.objects.create(user=request.user, type='error', content=f"Error al actualizar oficina: {error_msg}")
        return JsonResponse({'success': False, 'error': error_msg}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["POST", "DELETE"])
def delete_office(request, office_id):
    if not can_access_admin(request.user):
        return JsonResponse({'success': False, 'error': 'Sin permisos'}, status=403)
    try:
        office = get_object_or_404(Office, id=office_id)
        off_code = office.code
        office.delete()

        Notification.objects.create(
            user=request.user,
            type='warning',
            content=f"Oficina '{off_code}' eliminada."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.DELETE_OFFICE,
            description=f"Oficina '{off_code}' eliminada",
            metadata={'deleted_office_id': str(office_id)}
        )

        return JsonResponse({'success': True, 'message': 'Oficina eliminada exitosamente'})
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al eliminar oficina: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_offices(request):
    try:
        offices = Office.objects.all().order_by('code')
        
        offices_data = []
        for office in offices:
            offices_data.append({
                'id': str(office.id),
                'code': office.code,
                'name': office.name
            })
        
        stats = {
            'total_offices': offices.count(),
            'active_offices': offices.count()  # Asumiendo todas activas
        }
        
        return JsonResponse({
            'success': True,
            'offices': offices_data,
            'stats': stats
        })
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al obtener oficinas: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
def get_users(request):
    """API endpoint para obtener la lista de usuarios"""
    try:
        page = int(request.GET.get('page', 1))
        items_per_page = int(request.GET.get('items_per_page', 10))
        
        users = User.objects.all().select_related()
        total_count = users.count()
        total_pages = (total_count + items_per_page - 1) // items_per_page if total_count > 0 else 1
        start_index = (page - 1) * items_per_page
        end_index = start_index + items_per_page
        users_page = users[start_index:end_index]
        
        user_ids = [u.id for u in users_page]
        user_roles = {}
        for ur in UserRole.objects.select_related('role').filter(user_id__in=user_ids):
            if ur.user.id not in user_roles:
                user_roles[ur.user.id] = []
            user_roles[ur.user.id].append({'id': str(ur.role.id), 'name': ur.role.name})
        
        users_data = []
        for user in users_page:
            role_info = user_roles.get(user.id, [])
            main_role = role_info[0]['name'] if role_info else 'Sin rol'
            users_data.append({
                'id': str(user.id),
                'username': user.username,
                'email': user.email or '—',
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'role_id': role_info[0]['id'] if role_info else '',
                'role_name': main_role,
                'roles': [r['name'] for r in role_info],
                'is_active': user.is_active,
                'created_at': date_format(user.created_at, 'd/m/Y H:i'),
                'updated_at': date_format(user.updated_at, 'd/m/Y H:i')
            })
        
        active_users = users.filter(is_active=True).count()
        inactive_users = users.filter(is_active=False).count()
        admin_count = UserRole.objects.filter(role__name='Administrador').count()
        
        return JsonResponse({
            'success': True,
            'users': users_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_count': total_count,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'stats': {
                'total_users': total_count,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'admin_count': admin_count
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
def get_operations(request):
    """API endpoint para obtener la lista de operaciones"""
    try:
        page = int(request.GET.get('page', 1))
        items_per_page = int(request.GET.get('items_per_page', 10))
        
        operations = Operation.objects.all().order_by('code')
        total_count = operations.count()
        total_pages = (total_count + items_per_page - 1) // items_per_page if total_count > 0 else 1
        start_index = (page - 1) * items_per_page
        end_index = start_index + items_per_page
        operations_page = operations[start_index:end_index]
        
        operations_data = []
        for op in operations_page:
            operations_data.append({
                'id': str(op.id),
                'code': op.code,
                'name': op.name,
                'created_at': date_format(op.created_at, 'd/m/Y H:i'),
                'updated_at': date_format(op.updated_at, 'd/m/Y H:i')
            })
        
        return JsonResponse({
            'success': True,
            'operations': operations_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_count': total_count,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'stats': {
                'total_operations': total_count,
                'active_operations': total_count
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
def get_bank_accounts(request):
    """API endpoint para obtener la lista de cuentas bancarias"""
    try:
        page = int(request.GET.get('page', 1))
        items_per_page = int(request.GET.get('items_per_page', 10))
        
        bank_accounts = BankAccount.objects.all().order_by('code')
        total_count = bank_accounts.count()
        total_pages = (total_count + items_per_page - 1) // items_per_page if total_count > 0 else 1
        start_index = (page - 1) * items_per_page
        end_index = start_index + items_per_page
        banks_page = bank_accounts[start_index:end_index]
        
        banks_data = []
        for bank in banks_page:
            banks_data.append({
                'id': str(bank.id),
                'code': bank.code,
                'name': bank.name,
                'created_at': date_format(bank.created_at, 'd/m/Y H:i'),
                'updated_at': date_format(bank.updated_at, 'd/m/Y H:i')
            })
        
        return JsonResponse({
            'success': True,
            'banks': banks_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_count': total_count,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'stats': {
                'total_bank_accounts': total_count
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@login_required
def get_offices(request):
    """API endpoint para obtener la lista de oficinas"""
    try:
        page = int(request.GET.get('page', 1))
        items_per_page = int(request.GET.get('items_per_page', 10))
        
        offices = Office.objects.all().order_by('code')
        total_count = offices.count()
        total_pages = (total_count + items_per_page - 1) // items_per_page if total_count > 0 else 1
        start_index = (page - 1) * items_per_page
        end_index = start_index + items_per_page
        offices_page = offices[start_index:end_index]
        
        offices_data = []
        for office in offices_page:
            offices_data.append({
                'id': str(office.id),
                'code': office.code,
                'name': office.name,
                'created_at': date_format(office.created_at, 'd/m/Y H:i'),
                'updated_at': date_format(office.updated_at, 'd/m/Y H:i')
            })
        
        return JsonResponse({
            'success': True,
            'offices': offices_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_count': total_count,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'stats': {
                'total_offices': total_count,
                'active_offices': total_count
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
def logout_view(request):
    if request.user.is_authenticated:
        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.LOGOUT,
            description=f'Cierre de sesión',
        )
    logout(request)
    return redirect('login')

@login_required
@require_GET
def get_unread_notifications(request):
    """Obtiene las últimas 10 notificaciones no leídas del usuario logueado."""
    notifications = Notification.objects.filter(
        user=request.user, 
        read_at__isnull=True
    ).order_by('-created_at')[:10]
    
    total_count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
    
    data = [{
        'id': str(n.id),
        'type': n.type,
        'content': n.content,
        'created_at': date_format(n.created_at, 'd/m/Y H:i'),
        'timestamp': int(n.created_at.timestamp() * 1000)
    } for n in notifications]
    
    return JsonResponse({
        'success': True,
        'notifications': data, 
        'count': total_count
    })

@login_required
@require_POST
def mark_notifications_read(request):
    """Marca todas las notificaciones pendientes como leídas."""
    Notification.objects.filter(
        user=request.user, 
        read_at__isnull=True
    ).update(read_at=timezone.now())
    
    return JsonResponse({'success': True})

@login_required
@require_GET
def get_user_activities(request):
    """Obtiene las últimas 10 actividades del usuario."""
    activities = UserActivity.objects.filter(
        user=request.user
    ).order_by('-created_at')[:10]

    data = [{
        'id': str(a.id),
        'action': a.action,
        'description': a.description,
        'metadata': a.metadata,
        'created_at': date_format(a.created_at, 'd/m/Y H:i'),
    } for a in activities]

    return JsonResponse({
        'success': True,
        'activities': data
    })

@login_required
@require_GET
def get_user_notifications(request):
    """Obtiene las notificaciones del usuario con paginación.
    
    Limite: 20 notificaciones por página
    Máximo: 5 páginas (100 notificaciones totales)
    """
    try:
        page = int(request.GET.get('page', 1))
        items_per_page = 20
        max_pages = 5
        
        if page < 1:
            page = 1
        if page > max_pages:
            page = max_pages
        
        offset = (page - 1) * items_per_page
        limit = items_per_page
        
        queryset = Notification.objects.filter(user=request.user).order_by('-created_at')
        
        total_count = queryset.count()
        
        notifications = queryset[offset:offset + limit]
        
        total_pages = min((total_count + items_per_page - 1) // items_per_page, max_pages)
        if total_count == 0:
            total_pages = 1
        
        data = [{
            'id': str(n.id),
            'type': n.type,
            'content': n.content,
            'read_at': date_format(n.read_at, 'd/m/Y H:i') if n.read_at else None,
            'created_at': date_format(n.created_at, 'd/m/Y H:i'),
            'is_read': n.read_at is not None
        } for n in notifications]
        
        has_next = page < total_pages and offset + items_per_page < total_count
        has_previous = page > 1
        
        return JsonResponse({
            'success': True,
            'notifications': data,
            'current_page': page,
            'total_pages': total_pages,
            'has_next': has_next,
            'has_previous': has_previous,
            'total_count': total_count
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def update_avatar_color(request):
    """Actualiza el color del avatar del usuario."""
    try:
        data = json.loads(request.body)
        color = data.get('avatar_color', '#003E6F')
        
        # Validar que es un color hex válido
        if not color.startswith('#') or len(color) != 7:
            return JsonResponse({'success': False, 'error': 'Color inválido'}, status=400)
        
        # Guardar en la base de datos
        request.user.avatar_color = color
        request.user.save(update_fields=['avatar_color'])
        
        # Actualizar la sesión del usuario para que el cambio se refleje inmediatamente
        request.session['avatar_color'] = color
        
        # También actualizar el usuario en la sesión de Django
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Actualizar el caché del usuario en la sesión
        request.user.refresh_from_db()
        
        return JsonResponse({'success': True, 'color': color})
    except json.JSONDecodeError:
        Notification.objects.create(user=request.user, type='error', content="Error al actualizar color de avatar: datos inválidos")
        return JsonResponse({'success': False, 'error': 'Datos inválidos'}, status=400)
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al actualizar color de avatar: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
def get_reports(request):
    try:
        page = int(request.GET.get('page', 1))
        items_per_page = int(request.GET.get('items_per_page', 20))
        
        if page < 1:
            page = 1
        if items_per_page < 1 or items_per_page > 100:
            items_per_page = 20
        
        total_count = BugReport.objects.count()
        total_pages = (total_count + items_per_page - 1) // items_per_page
        
        offset = (page - 1) * items_per_page
        reports = BugReport.objects.select_related('reporter').annotate(
            priority=Case(
                When(status='pending', then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            )
        ).order_by('priority', '-created_at')[offset:offset + items_per_page]
        
        data = [{
            'id': str(r.id),
            'reporter_id': str(r.reporter.id),
            'reporter_name': r.reporter.username,
            'reporter_full_name': f"{r.reporter.first_name} {r.reporter.last_name}",
            'type': r.type,
            'subject': r.subject,
            'description': r.description,
            'status': r.status,
            'created_at': date_format(r.created_at, 'd/m/Y H:i'),
            'updated_at': date_format(r.updated_at, 'd/m/Y H:i'),
        } for r in reports]
        
        has_next = page < total_pages
        has_previous = page > 1
        
        return JsonResponse({
            'success': True,
            'reports': data,
            'current_page': page,
            'total_pages': total_pages,
            'has_next': has_next,
            'has_previous': has_previous,
            'total_count': total_count
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def create_report(request):
    try:
        data = json.loads(request.body)
        
        report_type = data.get('type')
        subject = data.get('subject')
        description = data.get('description')
        
        if not report_type or not subject or not description:
            return JsonResponse({'success': False, 'error': 'Todos los campos son requeridos'}, status=400)
        
        report = BugReport.objects.create(
            reporter=request.user,
            type=report_type,
            subject=subject,
            description=description,
            status='pending'
        )
        
        Notification.objects.create(
            user=request.user,
            type='success',
            content=f'Reporte "{subject}" enviado correctamente'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Reporte enviado correctamente',
            'report_id': str(report.id)
        })
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al enviar reporte: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["PATCH"])
def update_report_status(request, report_id):
    try:
        if not can_access_admin(request.user):
            return JsonResponse({'success': False, 'error': 'No tienes permiso para realizar esta acción'}, status=403)
        
        report = get_object_or_404(BugReport, id=report_id)
        data = json.loads(request.body)
        
        new_status = data.get('status')
        if new_status not in ['pending', 'resolved']:
            return JsonResponse({'success': False, 'error': 'Estado inválido'}, status=400)
        
        report.status = new_status
        report.save()
        
        if new_status == 'resolved':
            Notification.objects.create(
                user=request.user,
                type='success',
                content=f'Reporte "{report.subject}" marcado como resuelto'
            )
        else:
            Notification.objects.create(
                user=request.user,
                type='info',
                content=f'Reporte "{report.subject}" marcado como pendiente'
            )
        
        return JsonResponse({
            'success': True,
            'message': f'Reporte marcado como {"solucionado" if new_status == "resolved" else "pendiente"}'
        })
    except json.JSONDecodeError:
        Notification.objects.create(user=request.user, type='error', content="Error al actualizar reporte: datos inválidos")
        return JsonResponse({'success': False, 'error': 'Datos inválidos'}, status=400)
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al actualizar reporte: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_report(request, report_id):
    try:
        if not can_access_admin(request.user):
            return JsonResponse({'success': False, 'error': 'No tienes permiso para realizar esta acción'}, status=403)
        
        report = get_object_or_404(BugReport, id=report_id)
        report_subject = report.subject
        report.delete()
        
        Notification.objects.create(
            user=request.user,
            type='warning',
            content=f'Reporte "{report_subject}" eliminado'
        )
        
        return JsonResponse({'success': True, 'message': 'Reporte eliminado correctamente'})
    except Exception as e:
        Notification.objects.create(user=request.user, type='error', content=f"Error al eliminar reporte: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)