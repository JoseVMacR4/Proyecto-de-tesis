import re
from datetime import datetime
from decimal import Decimal

ACCOUNT_CODE_PATTERNS = [
    r'(?:N[°º]?.?\s*)?CUENTA[:\s]+([\d-]+)',
    r'(?:N[°º]?.?\s*)?N(?:Ú|U)MERO(?: DE)? CUENTA[:\s]+([\d-]+)',
    r'(?:N[°º]?.?\s*)?NRO(?:.|°)? CUENTA[:\s]+([\d-]+)',
    r'CUENTA(?: N[°º]?.?)?[:\s]+([\d-]+)',
]

# Regex robusto: tolera espacios finales, guiones en refs y formatos variables
TX_PATTERN = re.compile(r'^([A-Za-z0-9\-]+)\s+([A-Za-z0-9\-]+)\s+([0-9,.]+)\s+(Cr|Db)\s*$')

def _parse_amount(amount_str):
    if not amount_str:
        return Decimal('0.0000')
    # Limpiamos las comas y eliminamos los sufijos Cr o Db que acompañan a los saldos
    cleaned = amount_str.replace(',', '').replace('Cr', '').replace('Db', '').strip()
    try:
        return Decimal(cleaned)
    except Exception:
        return Decimal('0.0000')


def _parse_operation_count(text):
    if not text:
        return 1
    match = re.search(r'Cantidad de Operaciones:\s*(\d+)', text, re.IGNORECASE)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return 1
    return 1


def _parse_operation_type(text):
    if not text:
        return None
    first_line = text.splitlines()[0].strip()
    return first_line or None


def parse_txt_statement(content):
    lines = content.splitlines()
    data = {
        'statement_date': None, 'period_start': None, 'period_end': None,
        'starting_balance': Decimal('0'), 'ending_balance': Decimal('0'),
        'overdraft_balance': Decimal('0'), 'reserved_balance': Decimal('0'),
        'available_balance': Decimal('0'), 'transactions': [],
        'account_code': None
    }
    current_tx = None
    date_pattern = re.compile(r'^\d{2}/\d{2}/\d{2}$')

    def _extract_account_code(text):
        if not text:
            return None
        for pattern in ACCOUNT_CODE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _should_skip_opening_tx(tx_dict, starting_bal):
        """Ignora transacciones que coinciden en monto con el saldo inicial y contienen la descripción clave."""
        if tx_dict['amount'] != starting_bal or starting_bal == Decimal('0'):
            return False
        desc = tx_dict.get('name', '').lower()
        return 'transfiriendo' in desc and 'al cierre' in desc

    for line in lines:
        stripped = line.strip()

        if not data['account_code']:
            account_code = _extract_account_code(stripped)
            if account_code:
                data['account_code'] = account_code

        if 'FECHA:' in stripped:
            try:
                data['statement_date'] = datetime.strptime(stripped.split('FECHA:')[1].strip(), '%d/%m/%Y').date()
            except: pass
            
        if 'DESDE:' in stripped and 'HASTA:' in stripped:
            try:
                parts = stripped.split('HASTA:')
                data['period_start'] = datetime.strptime(parts[0].split('DESDE:')[1].strip(), '%d/%m/%Y').date()
                data['period_end'] = datetime.strptime(parts[1].strip(), '%d/%m/%Y').date()
            except: pass
            
        if stripped.startswith('SALDO INICIAL:'):
            data['starting_balance'] = _parse_amount(stripped.split(':', 1)[1])
        elif stripped.startswith('SALDO FINAL:'):
            data['ending_balance'] = _parse_amount(stripped.split(':', 1)[1])
        elif stripped.startswith('SOBREGIROS AUTORIZADOS:'):
            data['overdraft_balance'] = _parse_amount(stripped.split(':', 1)[1])
        elif stripped.startswith('FONDOS RESERVADOS:'):
            data['reserved_balance'] = _parse_amount(stripped.split(':', 1)[1])
        elif stripped.startswith('FONDO DISPONIBLE:'):
            data['available_balance'] = _parse_amount(stripped.split(':', 1)[1])
            
        if date_pattern.match(stripped):
            continue

        match = TX_PATTERN.match(stripped)
        if match:
            if current_tx:
                # Filtro seguro antes de guardar
                if not _should_skip_opening_tx(current_tx, data['starting_balance']):
                    data['transactions'].append(current_tx)
            
            entry_type_raw = match.group(4)
            current_tx = {
                'current_reference': match.group(1),
                'original_reference': match.group(2),
                'amount': _parse_amount(match.group(3)),
                'entry_type': 'Cr' if entry_type_raw.upper() == 'CR' else 'Db',
                'operation_type': None,
                'operation_count': 1,
                'name': '',
                'office_code': None,
                'bank_fee': Decimal('0.00')
            }
        elif current_tx:
            current_tx['name'] += stripped + '\n'
            
            if current_tx['operation_type'] is None:
                current_tx['operation_type'] = _parse_operation_type(current_tx['name'])

            current_tx['operation_count'] = _parse_operation_count(current_tx['name'])
            
            # 1. Busca Oficina Comercial
            office_m = re.search(r'Oficina Comercial:\s*(\d+)', current_tx['name'])
            if office_m:
                current_tx['office_code'] = office_m.group(1)
            else:
                # 2. Fallback: Tienda Virtual
                tienda_m = re.search(r'Tienda Virtual:\s*([A-Za-z0-9]+)', current_tx['name'])
                if tienda_m:
                    current_tx['office_code'] = tienda_m.group(1)
                elif 'enzona' in current_tx['name'].lower():
                    current_tx['office_code'] = 'ENZONA'

            fee_m = re.search(r'Comisiones:\s*([0-9,.]+)', current_tx['name'])
            if fee_m:
                current_tx['bank_fee'] = _parse_amount(fee_m.group(1))
                
    # Cierre: procesar la última transacción del archivo
    if current_tx:
        if not _should_skip_opening_tx(current_tx, data['starting_balance']):
            data['transactions'].append(current_tx)
        
    return data