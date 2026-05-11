import os
import re
import uuid
from django.conf import settings
from .parsers import parse_txt_statement
from .models import BankStatement, BankStatementTransaction
from apps.bank_accounts.models import BankAccount, Operation

def process_statement_upload(uploaded_file, bank_account_id):
    """
    Procesa un archivo subido: valida, guarda, parsea y persiste en BD.
    """
    if not uploaded_file:
        raise ValueError("No se proporcionó archivo.")
        
    ext = uploaded_file.name.rsplit('.', 1)[-1].lower() if '.' in uploaded_file.name else ''
    if ext != 'txt':
        raise ValueError(f"Formato '{ext}' no soportado. Use .txt")

    # 1. Guardar archivo localmente en MEDIA_ROOT
    temp_rel_path = f"{uuid.uuid4().hex}_{uploaded_file.name}"
    abs_temp_path = os.path.join(settings.MEDIA_ROOT, temp_rel_path)
    abs_saved_path = abs_temp_path

    os.makedirs(os.path.dirname(abs_temp_path), exist_ok=True)
    with open(abs_temp_path, 'wb+') as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    try:
        # 2. Leer y Parsear
        with open(abs_temp_path, 'r', encoding='utf-8') as f:
            content = f.read()

        parsed = parse_txt_statement(content)
        if not parsed['statement_date']:
            raise ValueError("No se detectó fecha válida en el extracto.")

        # 3. Validar cuenta y duplicados
        try:
            account = BankAccount.objects.get(id=bank_account_id)
        except BankAccount.DoesNotExist:
            raise ValueError(f"Cuenta bancaria con ID {bank_account_id} no encontrada.")

        def _normalize_account_code(value):
            return re.sub(r'[^A-Za-z0-9]', '', value or '').upper()

        if parsed.get('account_code'):
            if _normalize_account_code(parsed['account_code']) != _normalize_account_code(account.code):
                raise ValueError(
                    'La cuenta seleccionada no coincide con la cuenta del archivo. '
                    f'Archivo: {parsed["account_code"]}, selección: {account.code}'
                )
        else:
            raise ValueError(
                'No se pudo verificar el número de cuenta en el archivo. '
                'Asegúrese de que el archivo contenga el número de cuenta.'
            )

        if BankStatement.objects.filter(bank_account=account, statement_date=parsed['statement_date']).exists():
            raise ValueError(
                f"Ya existe un estado de cuenta para la cuenta {account.code} en la fecha {parsed['statement_date']}."
            )

        # 4. Renombrar el archivo al patrón deseado: fecha_banco.txt
        saved_file_name = f"{parsed['statement_date'].isoformat()}_{_normalize_account_code(account.code)}.{ext}"
        abs_saved_path = os.path.join(settings.MEDIA_ROOT, saved_file_name)
        os.makedirs(os.path.dirname(abs_saved_path), exist_ok=True)
        if abs_saved_path != abs_temp_path:
            os.replace(abs_temp_path, abs_saved_path)

        # 5. Persistir en Base de Datos
        file_size = os.path.getsize(abs_saved_path)
        stmt = BankStatement.objects.create(
            bank_account=account,
            file_name=saved_file_name,
            file_extension=ext,
            file_size=file_size,
            statement_date=parsed['statement_date'],
            period_start=parsed['period_start'] or parsed['statement_date'],
            period_end=parsed['period_end'] or parsed['statement_date'],
            starting_balance=parsed['starting_balance'],
            ending_balance=parsed['ending_balance'],
            overdraft_balance=parsed['overdraft_balance'],
            reserved_balance=parsed['reserved_balance'],
            available_balance=parsed['available_balance'],
            entry_count=len(parsed['transactions'])
        )
    except Exception as e:
        if os.path.exists(abs_temp_path):
            os.remove(abs_temp_path)
        if abs_saved_path != abs_temp_path and os.path.exists(abs_saved_path):
            os.remove(abs_saved_path)
        raise e

    # Crear las transacciones en bloque para eficiencia
    operation_map = {op.code: op.name for op in Operation.objects.all()}
    
    txs = []
    for tx in parsed['transactions']:
        op_code_match = None
        op_name_match = None
        name_lower = tx['name'].lower()
        
        for code, name in operation_map.items():
            if code.lower() in name_lower:
                op_code_match = code
                op_name_match = name
                break
                
        txs.append(BankStatementTransaction(
            bank_statement=stmt,
            current_reference=tx['current_reference'],
            original_reference=tx.get('original_reference'),
            name=tx['name'][:250],
            bank_account=account,
            office_code=tx.get('office_code'),
            entry_type=tx['entry_type'],
            operation_type=op_code_match or tx.get('operation_type'),
            operation_name=op_name_match,
            operation_count=tx.get('operation_count', 1),
            bank_fee=tx['bank_fee'],
            amount=tx['amount'],
            currency='CUP',
            date=stmt.statement_date,
        ))
    
    BankStatementTransaction.objects.bulk_create(txs)
    
    return stmt