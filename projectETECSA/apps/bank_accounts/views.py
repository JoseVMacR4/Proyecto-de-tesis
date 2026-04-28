from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import csv


# Create your views here.
@login_required
def bank_accounts(request):
    context = {
        'current_page': 'bank_accounts'
    }
    return render(request, 'bank_accounts/bank_accounts.html', context)


@require_http_methods(["POST"])
@login_required
def upload_bank_statement(request):
    """
    API para cargar archivos de estados de cuenta bancarios.
    Valida extensión, peso máximo y columnas mínimas esperadas.
    """
    try:
        if 'file' not in request.FILES:
            return JsonResponse({
                'status': 'error',
                'message': 'No se encontró ningún archivo en la solicitud.'
            }, status=400)
        
        uploaded_file = request.FILES['file']
        
        # Validación 1: Extensión del archivo
        allowed_extensions = ['csv', 'xlsx', 'xls', 'pdf']
        file_extension = uploaded_file.name.split('.')[-1].lower() if '.' in uploaded_file.name else ''
        
        if file_extension not in allowed_extensions:
            return JsonResponse({
                'status': 'error',
                'message': f'Formato no permitido. Use CSV, XLSX, XLS o PDF. Extensión encontrada: {file_extension}'
            }, status=400)
        
        # Validación 2: Peso máximo (5MB según el template)
        max_file_size = 5 * 1024 * 1024  # 5MB en bytes
        
        if uploaded_file.size > max_file_size:
            return JsonResponse({
                'status': 'error',
                'message': f'El archivo excede el tamaño máximo permitido de 5MB. Tamaño: {uploaded_file.size / (1024 * 1024):.2f}MB'
            }, status=400)
        
        # Validación 3: Columnas mínimas esperadas (solo para CSV)
        headers = None
        row_count = 0
        
        if file_extension == 'csv':
            try:
                # Leer el archivo para validar columnas
                uploaded_file.seek(0)
                file_content = uploaded_file.read().decode('utf-8')
                uploaded_file.seek(0)
                
                # Detectar el delimiter automáticamente
                sample = file_content[:1024]
                dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
                uploaded_file.seek(0)
                
                reader = csv.reader(uploaded_file.read().decode('utf-8').splitlines(), dialect)
                headers = next(reader, None)
                
                if not headers:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'El archivo CSV está vacío o no tiene encabezados.'
                    }, status=400)
                
                # Columnas mínimas esperadas
                required_columns = ['referencia', 'fecha', 'monto', 'concepto', 'saldo']
                headers_lower = [h.lower().strip() for h in headers]
                
                missing_columns = []
                for col in required_columns:
                    if not any(col in h for h in headers_lower):
                        missing_columns.append(col)
                
                if missing_columns:
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Columnas requeridas faltantes: {", ".join(missing_columns)}. Encabezados encontrados: {", ".join(headers)}'
                    }, status=400)
                
                # Contar filas de datos (excluyendo encabezado)
                row_count = sum(1 for _ in reader)
                
                if row_count == 0:
                    return JsonResponse({
                        'status': 'warning',
                        'message': 'El archivo CSV no contiene datos después de los encabezados.',
                        'file_name': uploaded_file.name,
                        'file_size': uploaded_file.size,
                        'extension': file_extension,
                        'columns_found': headers
                    })
                
            except Exception as e:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Error al procesar el archivo CSV: {str(e)}'
                }, status=400)
        
        # Si todas las validaciones pasan, retornar éxito
        # Nota: Aquí se podría guardar el archivo o procesarlo según sea necesario
        response_data = {
            'status': 'success',
            'message': f'Archivo "{uploaded_file.name}" cargado exitosamente.',
            'file_name': uploaded_file.name,
            'file_size': uploaded_file.size,
            'file_size_formatted': format_file_size(uploaded_file.size),
            'extension': file_extension,
            'upload_date': timezone.now().strftime('%d/%m/%Y %H:%M'),
        }
        
        if file_extension == 'csv' and headers:
            response_data['columns_found'] = headers
            response_data['row_count'] = row_count
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error inesperado al procesar el archivo: {str(e)}'
        }, status=500)


def format_file_size(size_bytes):
    """
    Formatea el tamaño del archivo en una cadena legible.
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"