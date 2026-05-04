from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.utils.formats import date_format
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError
from apps.reconciliation.models import BankStatementTransaction
from apps.users.permissions import can_upload_statements, can_reconcile
from apps.bank_accounts.models import BankAccount, Office, Operation
from apps.users.models import Notification
import json

# Create your views here.
@login_required
def reconciliation_view(request):
	"""
	Vista principal para la conciliación bancaria
	"""
	page_number = request.GET.get('page', 1)
	transactions = BankStatementTransaction.objects.select_related('bank_account', 'bank_statement').order_by('-bank_statement__statement_date', 'current_reference')
	paginator = Paginator(transactions, 50)
	page_obj = paginator.get_page(page_number)

	page_range = []
	total_pages = paginator.num_pages
	current_page = page_obj.number
	window = 5
	if total_pages <= window:
		page_range = range(1, total_pages + 1)
	else:
		left = max(current_page - 2, 1)
		right = min(current_page + 2, total_pages)
		if left == 1:
			right = 5
		elif right == total_pages:
			left = total_pages - 4
		page_range = range(left, right + 1)

	# Calcular estadísticas
	total_transactions = BankStatementTransaction.objects.count()
	reconciled_count = BankStatementTransaction.objects.filter(status=BankStatementTransaction.StatusChoices.RECONCILED).count()
	pending_count = total_transactions - reconciled_count
	
	# Calcular porcentaje de conciliadas
	reconciled_percentage = 0
	if total_transactions > 0:
		reconciled_percentage = round((reconciled_count / total_transactions) * 100)

	context = {
		'title': 'Conciliación Bancaria',
		'page': 'reconciliation',
		'current_page': 'reconciliation',
		'transactions_page': page_obj,
		'page_range': page_range,
		'total_transactions': paginator.count,
		'total_count': total_transactions,
		'reconciled_count': reconciled_count,
		'pending_count': pending_count,
		'reconciled_percentage': reconciled_percentage,
	}
	return render(request, 'reconciliation/reconciliation.html', context)

@require_http_methods(["GET"])
@login_required
def get_reconciliation_data(request):
	try:
		date_range = request.GET.get('date_range', '')
		date_from = request.GET.get('date_from', '')
		date_to = request.GET.get('date_to', '')
		bank = request.GET.get('bank', '')
		status = request.GET.get('status', '')
		reference = request.GET.get('reference', '')
		name = request.GET.get('name', '')
		office_code = request.GET.get('office_code', '')
		entry_type = request.GET.get('entry_type', '')
		operation_type = request.GET.get('operation_type', '')
		amount_min = request.GET.get('amount_min', '')
		amount_max = request.GET.get('amount_max', '')
		currency = request.GET.get('currency', '')
		page = request.GET.get('page', 1)

		transactions = BankStatementTransaction.objects.select_related('bank_account', 'bank_statement').order_by('-bank_statement__statement_date', 'current_reference')

		# Filtro por rango de fechas
		if date_range:
			parts = [part.strip() for part in date_range.split('-')]
			if len(parts) == 2:
				try:
					start_date = timezone.datetime.strptime(parts[0], '%d/%m/%Y').date()
					end_date = timezone.datetime.strptime(parts[1], '%d/%m/%Y').date()
					transactions = transactions.filter(bank_statement__statement_date__range=(start_date, end_date))
				except ValueError:
					pass
		elif date_from or date_to:
			if date_from:
				try:
					start_date = timezone.datetime.strptime(date_from, '%Y-%m-%d').date()
					transactions = transactions.filter(bank_statement__statement_date__gte=start_date)
				except ValueError:
					pass
			if date_to:
				try:
					end_date = timezone.datetime.strptime(date_to, '%Y-%m-%d').date()
					transactions = transactions.filter(bank_statement__statement_date__lte=end_date)
				except ValueError:
					pass

		# Filtro por banco (múltiple) - buscar por código
		if bank:
			bank_list = [b.strip() for b in bank.split(',') if b.strip()]
			if bank_list:
				transactions = transactions.filter(bank_account__code__in=bank_list)

		# Filtro por estado (múltiple)
		if status:
			status_list = [s.strip() for s in status.split(',') if s.strip()]
			if status_list:
				transactions = transactions.filter(status__in=status_list)

		# Filtro por referencia
		if reference:
			transactions = transactions.filter(
				Q(current_reference__icontains=reference) | Q(original_reference__icontains=reference)
			)

		# Filtro por nombre/descripción
		if name:
			transactions = transactions.filter(name__icontains=name)

		# Filtro por código de oficina (múltiple)
		if office_code:
			office_list = [o.strip() for o in office_code.split(',') if o.strip()]
			if office_list:
				transactions = transactions.filter(office_code__in=office_list)

		# Filtro por tipo de entrada (múltiple)
		if entry_type:
			entry_list = [e.strip() for e in entry_type.split(',') if e.strip()]
			if entry_list:
				transactions = transactions.filter(entry_type__in=entry_list)

		# Filtro por tipo de operación (múltiple)
		if operation_type:
			operation_list = [o.strip() for o in operation_type.split(',') if o.strip()]
			if operation_list:
				transactions = transactions.filter(operation_type__in=operation_list)

		# Filtro por rango de monto
		if amount_min:
			try:
				min_amount = float(amount_min)
				transactions = transactions.filter(amount__gte=min_amount)
			except ValueError:
				pass
		if amount_max:
			try:
				max_amount = float(amount_max)
				transactions = transactions.filter(amount__lte=max_amount)
			except ValueError:
				pass

# Filtro por moneda (múltiple)
		if currency:
			currency_list = [c.strip() for c in currency.split(',') if c.strip()]
			if currency_list:
				transactions = transactions.filter(currency__in=currency_list)

		paginator = Paginator(transactions, 50)
		page_obj = paginator.get_page(page)

		office_map = {o.code: o.name for o in Office.objects.all()}
		operation_map = {o.code: o.name for o in Operation.objects.all()}

		transactions_data = []
		for tx in page_obj.object_list:
			try:
				office_value = tx.office_code or ''
				office_display = office_map.get(office_value, office_value) if office_value else ''
				operation_value = tx.operation_type or ''
				operation_display = operation_map.get(operation_value, '') if operation_value else ''
				transactions_data.append({
					'id': str(tx.id),
					'date': date_format(tx.date, 'd/m/Y'),
					'reference': tx.current_reference,
					'original_reference': tx.original_reference,
					'bank': tx.bank_account.name if tx.bank_account else 'N/A',
					'bank_code': tx.bank_account.code if tx.bank_account else 'N/A',
					'office': office_display,
					'office_code': office_value,
					'operations': tx.operation_count,
					'entity': tx.name,
					'amount': float(tx.amount),
					'entry_type': tx.entry_type,
					'bank_fee': float(tx.bank_fee),
					'operation_type': operation_display,
					'operation_type_code': operation_value,
					'currency': tx.currency,
					'statement_date': date_format(tx.bank_statement.statement_date, 'd/m/Y') if tx.bank_statement else '',
					'status': tx.status,
					'status_display': tx.get_status_display(),
      				'created_at': timezone.localtime(tx.created_at).strftime('%d/%m/%Y %H:%M') if tx.created_at else '',
					'updated_at': timezone.localtime(tx.updated_at).strftime('%d/%m/%Y %H:%M') if tx.updated_at else '',
				})
			except Exception as e:
				print(f"Error procesando transacción {tx.id}: {str(e)}")
				continue

		return JsonResponse({
			'status': 'success',
			'page': page_obj.number,
			'total_pages': paginator.num_pages,
			'total_transactions': paginator.count,
			'transactions': transactions_data,
   			'start_index': page_obj.start_index() if paginator.count > 0 else 0,
            'end_index': page_obj.end_index() if paginator.count > 0 else 0,
		})
	except Exception as e:
		import traceback
		print(f"Error en get_reconciliation_data: {str(e)}")
		traceback.print_exc()
		return JsonResponse({
			'status': 'error',
			'message': str(e)
		}, status=500)

@require_http_methods(["POST"])
@login_required
def reconcile_transaction(request):
    if not can_reconcile(request.user):
        return JsonResponse({'status': 'error', 'message': 'No tiene permiso para conciliar transacciones.'}, status=403)
    
    try:
        data = json.loads(request.body)
        tx_id = data.get('transaction_id')
        
        # Validación preventiva para evitar el error 400 de formato
        if not tx_id or tx_id == "undefined" or tx_id == "null":
            return JsonResponse({
                'status': 'error', 
                'message': 'ID de transacción no válido o vacío'
            }, status=400)
        
        try:
            transaction = BankStatementTransaction.objects.get(id=tx_id)
            transaction.status = BankStatementTransaction.StatusChoices.RECONCILED
            transaction.save()

            # ==========================================
            # NUEVO: Crear la notificación persistente
            # ==========================================
            Notification.objects.create(
                user=request.user,
                type='info', # Ajusta a Notification.NotificationType.INFO si usas TextChoices en tu modelo
                content=f"Transacción {transaction.current_reference} conciliada correctamente."
            )
            # ==========================================

            updated_at = timezone.localtime(transaction.updated_at).strftime('%d/%m/%Y %H:%M')

            return JsonResponse({
                'status': 'success',
                'message': f"Transacción {transaction.current_reference} conciliada correctamente", # Opcional: mejorar el mensaje de respuesta
                'updated_at': updated_at,
            })
        except BankStatementTransaction.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'La transacción ya no existe'}, status=404)
        except ValidationError:
            return JsonResponse({'status': 'error', 'message': 'Formato UUID inválido'}, status=400)

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
@login_required
def reconcile_transactions_bulk(request):
    if not can_reconcile(request.user):
        return JsonResponse({'status': 'error', 'message': 'No tiene permiso para conciliar transacciones.'}, status=403)
    
    try:
        data = json.loads(request.body)
        transaction_ids = data.get('transaction_ids', [])
        
        if not transaction_ids:
            return JsonResponse({'status': 'error', 'message': 'No se proporcionaron transacciones.'}, status=400)
        
        if len(transaction_ids) > 50:
            return JsonResponse({'status': 'error', 'message': 'El límite máximo es de 50 transacciones por operación.'}, status=400)
        
        pending_transactions = BankStatementTransaction.objects.filter(
            id__in=transaction_ids,
            status=BankStatementTransaction.StatusChoices.PENDING
        )
        
        count = pending_transactions.count()
        
        if count == 0:
            return JsonResponse({'status': 'error', 'message': 'No se encontraron transacciones pendientes para conciliar.'}, status=400)
        
        pending_transactions.update(status=BankStatementTransaction.StatusChoices.RECONCILED)
        
        notified_transactions = BankStatementTransaction.objects.filter(
            id__in=transaction_ids,
            status=BankStatementTransaction.StatusChoices.RECONCILED
        )
        
        notifications_to_create = [
            Notification(
                user=request.user,
                type='info',
                content=f"Transacción {tx.current_reference} conciliada correctamente."
            )
            for tx in notified_transactions
        ]
        Notification.objects.bulk_create(notifications_to_create)
        
        return JsonResponse({
            'status': 'success',
            'message': f'{count} transacción(es) conciliada(s) correctamente.',
            'count': count,
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Formato JSON inválido.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
@login_required
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

@require_http_methods(["GET"])
@login_required
def get_filter_options(request):
	"""
	API para obtener las opciones disponibles para los filtros
	"""
	try:
		# Obtener bancos
		banks = BankAccount.objects.values('code', 'name').order_by('code')
		bank_options = [{'value': '', 'label': 'Todos los Bancos'}]
		bank_options.extend([
			{'value': bank['code'], 'label': f"{bank['code']} - {bank['name']}"}
			for bank in banks
		])

		# Obtener tipos de entrada únicos
		entry_types = BankStatementTransaction.objects.values_list('entry_type', flat=True).distinct().exclude(entry_type__isnull=True).exclude(entry_type='').order_by('entry_type')
		entry_type_options = [{'value': '', 'label': 'Todos los Tipos'}]
		entry_type_options.extend([
			{'value': et, 'label': 'Crédito (Cr)' if et == 'Cr' else 'Débito (Db)'}
			for et in entry_types
		])

		# Obtener monedas únicas
		currencies = BankStatementTransaction.objects.values_list('currency', flat=True).distinct().exclude(currency__isnull=True).exclude(currency='').order_by('currency')
		currency_options = [{'value': '', 'label': 'Todas las Monedas'}]
		currency_options.extend([
			{'value': curr, 'label': curr}
			for curr in currencies
		])

		# Obtener oficinas registradas y códigos de transacciones
		registered_offices = {o.code: o.name for o in Office.objects.all()}
		transaction_office_codes = BankStatementTransaction.objects.values_list('office_code', flat=True).distinct().exclude(office_code__isnull=True).exclude(office_code='').order_by('office_code')
		
		office_options = [{'value': '', 'label': 'Todas las Oficinas'}]
		for code in transaction_office_codes:
			name = registered_offices.get(code, code)
			office_options.append({
				'value': code,
				'label': f"{code} - {name}" if code != name else code
			})

		# Obtener operaciones registradas y códigos de transacciones
		registered_ops = {o.code: o.name for o in Operation.objects.all()}
		transaction_op_codes = BankStatementTransaction.objects.values_list('operation_type', flat=True).distinct().exclude(operation_type__isnull=True).exclude(operation_type='').order_by('operation_type')
		
		operation_type_options = [{'value': '', 'label': 'Todos los Tipos'}]
		for code in transaction_op_codes:
			name = registered_ops.get(code, code)
			operation_type_options.append({
				'value': code,
				'label': f"{code} - {name}" if code != name else code
			})

		return JsonResponse({
			'status': 'success',
			'filters': {
				'banks': bank_options,
				'entry_types': entry_type_options,
				'currencies': currency_options,
				'offices': office_options,
				'operation_types': operation_type_options,
			}
		})
	except Exception as e:
		return JsonResponse({
			'status': 'error',
			'message': str(e)
		}, status=500)

@require_http_methods(["GET"])
@login_required
def get_reconciliation_stats(request):
    try:
        total_transactions = BankStatementTransaction.objects.count()
        reconciled_count = BankStatementTransaction.objects.filter(status=BankStatementTransaction.StatusChoices.RECONCILED).count()
        pending_count = total_transactions - reconciled_count
        
        reconciled_percentage = 0
        if total_transactions > 0:
            reconciled_percentage = round((reconciled_count / total_transactions) * 100)

        return JsonResponse({
            'status': 'success',
            'total_count': total_transactions,
            'reconciled_count': reconciled_count,
            'pending_count': pending_count,
            'reconciled_percentage': reconciled_percentage,
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)