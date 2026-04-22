from django.shortcuts import render

# Create your views here.
def inicio(request):
	context = {
		'current_page': 'transactions'
	}
	return render(request, 'transactions/transactions.html', context)