from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

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
    context = {
        'current_page': 'admin_panel'
    }
    return render(request, 'users/admin_panel.html', context)

@login_required
def logout_view(request):
    logout(request)
    return redirect('login')