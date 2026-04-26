from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
import json

# Create your views here.
@login_required
def reconciliation_view(request):
	"""
	Vista principal para la conciliación bancaria
	"""
	context = {
		'title': 'Conciliación Bancaria',
		'page': 'reconciliation',
		'current_page': 'reconciliation'
	}
	return render(request, 'reconciliation/reconciliation.html', context)

@require_http_methods(["GET"])
def get_reconciliation_data(request):
	"""
	API para obtener datos de reconciliación con filtros
	"""
	date_range = request.GET.get('date_range', '')
	bank = request.GET.get('bank', '')
	status = request.GET.get('status', '')
	page = request.GET.get('page', 1)
	
	# Aquí se conectaría con la base de datos
	# Por ahora retornamos datos de ejemplo
	data = {
		'status': 'success',
		'count': 1248,
		'page': page,
		'filters': {
			'date_range': date_range,
			'bank': bank,
			'status': status
		}
	}
	
	return JsonResponse(data)

@require_http_methods(["POST"])
def reconcile_transaction(request):
	"""
	API para conciliar una transacción
	"""
	try:
		data = json.loads(request.body)
		reference = data.get('reference')
		
		# Aquí se guardaría en la base de datos
		response = {
			'status': 'success',
			'message': f'Transacción {reference} conciliada exitosamente',
			'reference': reference
		}
		
		return JsonResponse(response)
	except Exception as e:
		return JsonResponse({
			'status': 'error',
			'message': str(e)
		}, status=400)

@require_http_methods(["POST"])
def export_reconciliation(request):
	"""
	API para exportar datos de reconciliación
	"""
	try:
		data = json.loads(request.body)
		format_type = data.get('format', 'csv')
		
		# Aquí se generaría el archivo
		response = {
			'status': 'success',
			'message': 'Archivo generado correctamente',
			'format': format_type
		}
		
		return JsonResponse(response)
	except Exception as e:
		return JsonResponse({
			'status': 'error',
			'message': str(e)
		}, status=400)