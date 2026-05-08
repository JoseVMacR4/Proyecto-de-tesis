from django.conf import settings
from django.core.paginator import Paginator
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, FileResponse
from django.views.decorators.http import require_POST, require_http_methods, require_GET
from django.db.models import Q
from decimal import Decimal
from apps.bank_accounts.models import BankAccount
from apps.reconciliation.models import BankStatement, BankStatementTransaction
from apps.reconciliation.services import process_statement_upload
from apps.users.models import Notification, UserActivity
from apps.users.permissions import can_upload_statements
from django.utils.formats import date_format
from django.utils import timezone
import logging
import os

logger = logging.getLogger(__name__)

@login_required
def bank_accounts(request):
    accounts = BankAccount.objects.all().order_by('code')
    statements = BankStatement.objects.select_related('bank_account').order_by('-created_at')
    
    # Filtros
    bank_account = request.GET.get('bank_account', '')
    period_start = request.GET.get('period_start', '')
    period_end = request.GET.get('period_end', '')
    starting_balance_min = request.GET.get('starting_balance_min', '')
    starting_balance_max = request.GET.get('starting_balance_max', '')
    ending_balance_min = request.GET.get('ending_balance_min', '')
    ending_balance_max = request.GET.get('ending_balance_max', '')
    
    # Filtro por banco (múltiple)
    if bank_account:
        bank_list = [b.strip() for b in bank_account.split(',') if b.strip()]
        if bank_list:
            statements = statements.filter(bank_account__code__in=bank_list)
    
    # Filtro por periodo desde
    if period_start:
        try:
            start_date = timezone.datetime.strptime(period_start, '%Y-%m-%d').date()
            statements = statements.filter(period_start__gte=start_date)
        except ValueError:
            pass
    
    # Filtro por periodo hasta
    if period_end:
        try:
            end_date = timezone.datetime.strptime(period_end, '%Y-%m-%d').date()
            statements = statements.filter(period_end__lte=end_date)
        except ValueError:
            pass
    
    # Filtro por saldo inicial
    if starting_balance_min:
        try:
            min_balance = Decimal(starting_balance_min)
            statements = statements.filter(starting_balance__gte=min_balance)
        except:
            pass
    
    if starting_balance_max:
        try:
            max_balance = Decimal(starting_balance_max)
            statements = statements.filter(starting_balance__lte=max_balance)
        except:
            pass
    
    # Filtro por saldo final
    if ending_balance_min:
        try:
            min_balance = Decimal(ending_balance_min)
            statements = statements.filter(ending_balance__gte=min_balance)
        except:
            pass
    
    if ending_balance_max:
        try:
            max_balance = Decimal(ending_balance_max)
            statements = statements.filter(ending_balance__lte=max_balance)
        except:
            pass
    
    page_number = request.GET.get('page', 1)
    paginator = Paginator(statements, 5)
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

    # Check if it's an AJAX request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # Return JSON for AJAX pagination
        statements_data = []
        for statement in page_obj.object_list:
            statements_data.append({
                'id': str(statement.id),
                'file_name': statement.file_name,
                'file_extension': statement.file_extension,
                'file_size': statement.file_size,
                'bank_account_name': statement.bank_account.name,
                'created_at': date_format(statement.created_at, 'd/m/Y H:i'),
                'period_start': date_format(statement.period_start, 'd/m/Y'),
                'period_end': date_format(statement.period_end, 'd/m/Y'),
                'starting_balance': float(statement.starting_balance),
                'ending_balance': float(statement.ending_balance),
                'entry_count': statement.entry_count,
            })
        
        return JsonResponse({
            'statements': statements_data,
            'pagination': {
                'current_page': current_page,
                'total_pages': total_pages,
                'has_previous': page_obj.has_previous(),
                'has_next': page_obj.has_next(),
                'previous_page_number': page_obj.previous_page_number() if page_obj.has_previous() else None,
                'next_page_number': page_obj.next_page_number() if page_obj.has_next() else None,
                'page_range': list(page_range),
                'start_index': page_obj.start_index(),
                'end_index': page_obj.end_index(),
                'total_statements': paginator.count,
            }
        })

    # Último statement cargado (para mostrar en la sidebar)
    last_statement = BankStatement.objects.order_by('-created_at').first()
    last_processing = None
    if last_statement:
        from django.utils.formats import date_format
        last_processing = {
            'time': date_format(last_statement.created_at, 'H:i'),
            'date': date_format(last_statement.created_at, 'd M Y'),
            'full_date': date_format(last_statement.created_at, 'd/m/Y'),
        }

    context = {
        'current_page': 'bank_accounts',
        'bank_accounts': accounts,
        'page_obj': page_obj,
        'page_range': page_range,
        'total_statements': paginator.count,
        'last_processing': last_processing,
    }
    
    return render(request, 'bank_accounts/bank_accounts.html', context)

@login_required
@require_POST
def upload_statement_api(request):
    if not can_upload_statements(request.user):
        return JsonResponse({'success': False, 'error': 'No tiene permiso para subir estados de cuenta.'}, status=403)
    
    try:
        uploaded_file = request.FILES.get('file')
        account_id = request.POST.get('account_id')

        if not uploaded_file:
            return JsonResponse({'success': False, 'error': 'Archivo requerido.'}, status=400)
        if not account_id:
            return JsonResponse({'success': False, 'error': 'ID de cuenta bancaria requerido.'}, status=400)

        stmt = process_statement_upload(uploaded_file, account_id)

        from django.utils.formats import date_format
        from django.utils import timezone
        
        # Formatear fechas usando Django para consistencia con la plantilla
        created_at_formatted = date_format(stmt.created_at, 'd/m/Y H:i')
        period_start_formatted = date_format(stmt.period_start, 'd/m/Y')
        period_end_formatted = date_format(stmt.period_end, 'd/m/Y')

        # Crear notificación persistente
        Notification.objects.create(
            user=request.user,
            type='info',
            content=f"Extracto bancario '{stmt.file_name}' cargado exitosamente con {stmt.entry_count} transacciones."
        )

        UserActivity.objects.create(
            user=request.user,
            action=UserActivity.ActionType.UPLOAD_STATEMENT,
            description=f"Estado de cuenta '{stmt.file_name}' subido ({stmt.entry_count} transacciones)",
            metadata={'statement_id': str(stmt.id), 'file_name': stmt.file_name, 'entry_count': stmt.entry_count}
        )

        return JsonResponse({
            'success': True,
            'message': f'Extracto {stmt.file_name} procesado exitosamente.',
            'data': {
                'id': str(stmt.id),
                'file': stmt.file_name,
                'file_extension': stmt.file_extension,
                'date': stmt.statement_date.isoformat(),
                'tx_count': stmt.entry_count,
                'bank_name': stmt.bank_account.name,
                'period_start': period_start_formatted,
                'period_end': period_end_formatted,
                'created_at': created_at_formatted,
                'file_size': stmt.file_size,
                'starting_balance': stmt.starting_balance,
                'ending_balance': stmt.ending_balance,
            }
        })

    except ValueError as e:
        logger.warning(f"Validación de extracto falló: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    except Exception as e:
        logger.error(f"Error al procesar extracto: {str(e)}")
        return JsonResponse({'success': False, 'error': 'Error interno del servidor.'}, status=500)


@login_required
@require_http_methods(["GET"])
def get_statement_detail(request, statement_file):
    """
    API para obtener los detalles completos de un estado de cuenta
    """
    try:
        logger.info(f"Obteniendo detalles de estado: {statement_file}")
        
        statement = get_object_or_404(BankStatement, file_name=statement_file)
        logger.info(f"Estado encontrado en BD: {statement.file_name}")
        
        # Obtener transacciones relacionadas
        transactions = BankStatementTransaction.objects.filter(
            bank_statement=statement
        ).order_by('date', 'current_reference')
        logger.info(f"Transacciones encontradas: {transactions.count()}")
        
        # Formatear fechas
        statement_date_formatted = date_format(statement.statement_date, 'd/m/Y')
        period_start_formatted = date_format(statement.period_start, 'd/m/Y')
        period_end_formatted = date_format(statement.period_end, 'd/m/Y')
        
        # Preparar datos de transacciones
        transactions_data = []
        for tx in transactions:
            transactions_data.append({
                'date': date_format(tx.date, 'd/m/Y'),
                'current_reference': tx.current_reference,
                'original_reference': tx.original_reference,
                'description': tx.name,
                'amount': float(tx.amount),
                'entry_type': tx.entry_type,
                'bank_fee': float(tx.bank_fee)
            })
        
        # Respuesta JSON con todos los datos
        response_data = {
            'id': str(statement.id),
            'bank_account_name': statement.bank_account.name,
            'bank_account_code': statement.bank_account.code,
            'statement_date': statement_date_formatted,
            'period_start': period_start_formatted,
            'period_end': period_end_formatted,
            'file_name': statement.file_name,
            'entry_count': statement.entry_count,
            'starting_balance': float(statement.starting_balance),
            'ending_balance': float(statement.ending_balance),
            'available_balance': float(statement.available_balance),
            'reserved_balance': float(statement.reserved_balance),
            'overdraft_balance': float(statement.overdraft_balance),
            'transactions': transactions_data
        }
        
        logger.info(f"Respuesta preparada para: {statement_file}")
        return JsonResponse(response_data)
        
    except BankStatement.DoesNotExist:
        logger.error(f"Estado de cuenta no encontrado: {statement_file}")
        return JsonResponse({
            'error': 'Estado de cuenta no encontrado'
        }, status=404)
    except Exception as e:
        logger.error(f"Error al obtener detalles del estado: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': f'Error al obtener el estado de cuenta: {str(e)}'
        }, status=500)


@login_required
@require_http_methods(["GET"])
def download_statement(request, statement_file):
    """
    API para descargar un estado de cuenta como archivo
    """
    try:
        logger.info(f"Descargando estado: {statement_file}")
        
        statement = get_object_or_404(BankStatement, file_name=statement_file)
        logger.info(f"Estado encontrado en BD: {statement.file_name}")
        
        # El archivo se encuentra en MEDIA_ROOT (que ahora es BASE_DIR/statements)
        file_path = os.path.join(settings.MEDIA_ROOT, statement.file_name)
        logger.info(f"Ruta del archivo: {file_path}")
        logger.info(f"Ruta existe: {os.path.exists(file_path)}")

        if not os.path.exists(file_path):
            logger.error(f"Archivo no encontrado: {file_path}")
            return JsonResponse({
                'error': f'Archivo no encontrado: {file_path}'
            }, status=404)
        
        # Descargar el archivo usando context manager
        try:
            file = open(file_path, 'rb')
            response = FileResponse(file)
            response['Content-Type'] = 'text/plain'
            response['Content-Disposition'] = f'attachment; filename="{statement.file_name}"'
            logger.info(f"Descarga iniciada: {statement.file_name}")
            return response
        except IOError as io_err:
            logger.error(f"Error al abrir archivo: {str(io_err)}")
            return JsonResponse({
                'error': f'Error al abrir archivo: {str(io_err)}'
            }, status=500)
        
    except BankStatement.DoesNotExist:
        logger.error(f"Estado de cuenta no encontrado: {statement_file}")
        return JsonResponse({
            'error': 'Estado de cuenta no encontrado'
        }, status=404)
    except Exception as e:
        logger.error(f"Error al descargar estado: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': f'Error al descargar el estado de cuenta: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def get_filter_options(request):
    """
    API para obtener las opciones disponibles para los filtros
    """
    try:
        banks = BankAccount.objects.values('code', 'name').order_by('code')
        bank_options = [{'value': '', 'label': 'Todos los Bancos'}]
        bank_options.extend([
            {'value': bank['code'], 'label': f"{bank['code']} - {bank['name']}"}
            for bank in banks
        ])

        return JsonResponse({
            'status': 'success',
            'filters': {
                'banks': bank_options
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@login_required
def bank_accounts_pagination_api(request):
    """API endpoint dedicado para paginación AJAX con filtros"""
    try:
        page = int(request.GET.get('page', 1))
        
        # Aplicar filtros (igual que en la vista principal)
        statements = BankStatement.objects.select_related('bank_account').order_by('-created_at')
        
        # Filtro por banco (múltiple)
        bank_account = request.GET.get('bank_account', '')
        if bank_account:
            bank_list = [b.strip() for b in bank_account.split(',') if b.strip()]
            if bank_list:
                statements = statements.filter(bank_account__code__in=bank_list)
        
        # Filtro por periodo desde
        period_start = request.GET.get('period_start', '')
        if period_start:
            try:
                start_date = timezone.datetime.strptime(period_start, '%Y-%m-%d').date()
                statements = statements.filter(period_start__gte=start_date)
            except ValueError:
                pass
        
        # Filtro por periodo hasta
        period_end = request.GET.get('period_end', '')
        if period_end:
            try:
                end_date = timezone.datetime.strptime(period_end, '%Y-%m-%d').date()
                statements = statements.filter(period_end__lte=end_date)
            except ValueError:
                pass
        
        # Filtro por saldo inicial
        starting_balance_min = request.GET.get('starting_balance_min', '')
        if starting_balance_min:
            try:
                min_balance = Decimal(starting_balance_min)
                statements = statements.filter(starting_balance__gte=min_balance)
            except:
                pass
        
        starting_balance_max = request.GET.get('starting_balance_max', '')
        if starting_balance_max:
            try:
                max_balance = Decimal(starting_balance_max)
                statements = statements.filter(starting_balance__lte=max_balance)
            except:
                pass
        
        # Filtro por saldo final
        ending_balance_min = request.GET.get('ending_balance_min', '')
        if ending_balance_min:
            try:
                min_balance = Decimal(ending_balance_min)
                statements = statements.filter(ending_balance__gte=min_balance)
            except:
                pass
        
        ending_balance_max = request.GET.get('ending_balance_max', '')
        if ending_balance_max:
            try:
                max_balance = Decimal(ending_balance_max)
                statements = statements.filter(ending_balance__lte=max_balance)
            except:
                pass
        
        # Ordenamiento dinámico
        sort_column = request.GET.get('sort', '')
        sort_order = request.GET.get('order', 'desc')
        
        sort_mapping = {
            'starting_balance': '-starting_balance',
            'ending_balance': '-ending_balance',
        }
        
        if sort_column and sort_column in sort_mapping:
            if sort_order == 'asc':
                order_field = sort_mapping[sort_column].lstrip('-')
            else:
                order_field = sort_mapping[sort_column]
            statements = statements.order_by(order_field)
        else:
            statements = statements.order_by('-created_at')
        
        paginator = Paginator(statements, 5)
        page_obj = paginator.get_page(page)
        
        statements_data = [{
            'id': str(s.id),
            'file_name': s.file_name,
            'file_extension': s.file_extension,
            'file_size': s.file_size,
            'bank_account_name': s.bank_account.name,
            'created_at': date_format(s.created_at, 'd/m/Y H:i'),
            'period_start': date_format(s.period_start, 'd/m/Y'),
            'period_end': date_format(s.period_end, 'd/m/Y'),
            'starting_balance': float(s.starting_balance),
            'ending_balance': float(s.ending_balance),
            'entry_count': s.entry_count,
        } for s in page_obj.object_list]
        
        # Calcular page_range
        total_pages = paginator.num_pages
        current_page = page_obj.number
        window = 5
        if total_pages <= window:
            page_range = list(range(1, total_pages + 1))
        else:
            left = max(current_page - 2, 1)
            right = min(current_page + 2, total_pages)
            if left == 1:
                right = 5
            elif right == total_pages:
                left = total_pages - 4
            page_range = list(range(left, right + 1))
        
        return JsonResponse({
            'statements': statements_data,
            'pagination': {
                'current_page': current_page,
                'total_pages': total_pages,
                'has_previous': page_obj.has_previous(),
                'has_next': page_obj.has_next(),
                'previous_page_number': page_obj.previous_page_number() if page_obj.has_previous() else None,
                'next_page_number': page_obj.next_page_number() if page_obj.has_next() else None,
                'page_range': page_range,
                'start_index': page_obj.start_index(),
                'end_index': page_obj.end_index(),
                'total_statements': paginator.count,
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)