from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def reporting_view(request):
	context = {
		'current_page': 'reporting'
	}
	return render(request, 'reporting/reporting.html', context)