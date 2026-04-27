from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
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
    }
    return render(request, 'users/admin_panel.html', context)

@login_required
def logout_view(request):
    logout(request)
    return redirect('login')