from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def bank_accounts(request):
    context = {
        'current_page': 'bank_accounts'
    }
    return render(request, 'bank_accounts/bank_accounts.html', context)