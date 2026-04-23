"""
Seed inicial para desarrollo y pruebas
- Roles y permisos básicos
- Usuario admin por defecto
- Catálogo de códigos (Office, BankAccount, Operation)
- Datos de prueba para BankAccount, Office, Operation
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from decimal import Decimal
from datetime import date, timedelta
from apps.rbac.models import User, Role, Permission, UserRole, RolePermission
from apps.catalog.models import CodeCatalog
from apps.bank_accounts.models import Bank, Office, BankAccount, Operation
from apps.statements.models import BankStatement, BankStatementTransaction
from apps.reports.models import SystemSetting, Reminder, Notification


def create_superuser():
    """Crear usuario administrador por defecto"""
    print("Creando superusuario admin...")
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@etecsa.cu',
            password='admin123',
            first_name='Administrador',
            last_name='Sistema'
        )
        print(f"  ✓ Superusuario creado: {admin.username}")
    else:
        print("  ℹ Superusuario ya existe")
        admin = User.objects.get(username='admin')
    return admin


def create_roles_and_permissions():
    """Crear roles y permisos básicos para RBAC"""
    print("\nCreando roles y permisos...")
    
    # Permisos por recurso
    permissions_data = [
        # Usuarios
        ('users.view', 'Ver usuarios'),
        ('users.create', 'Crear usuarios'),
        ('users.edit', 'Editar usuarios'),
        ('users.delete', 'Eliminar usuarios'),
        # Cuentas bancarias
        ('bank_accounts.view', 'Ver cuentas bancarias'),
        ('bank_accounts.create', 'Crear cuentas bancarias'),
        ('bank_accounts.edit', 'Editar cuentas bancarias'),
        ('bank_accounts.delete', 'Eliminar cuentas bancarias'),
        # Extractos
        ('statements.view', 'Ver extractos'),
        ('statements.upload', 'Subir extractos'),
        ('statements.process', 'Procesar extractos'),
        # Transacciones
        ('transactions.view', 'Ver transacciones'),
        ('transactions.match', 'Conciliar transacciones'),
        ('transactions.flag', 'Marcar transacciones'),
        # Reportes
        ('reports.view', 'Ver reportes'),
        ('reports.generate', 'Generar reportes'),
        # Catálogo
        ('catalog.view', 'Ver catálogo'),
        ('catalog.edit', 'Editar catálogo'),
        # Auditoría
        ('audit.view', 'Ver logs de auditoría'),
    ]
    
    created_permissions = {}
    for name, description in permissions_data:
        perm, _ = Permission.objects.get_or_create(
            name=name,
            defaults={'description': description}
        )
        created_permissions[name] = perm
    
    print(f"  ✓ {len(created_permissions)} permisos creados")
    
    # Roles básicos
    roles_data = [
        ('admin', 'Administrador del sistema', list(created_permissions.keys())),
        ('manager', 'Gerente', [
            'users.view', 'bank_accounts.view', 'statements.view',
            'transactions.view', 'reports.view', 'reports.generate',
            'audit.view', 'catalog.view'
        ]),
        ('analyst', 'Analista financiero', [
            'bank_accounts.view', 'statements.view', 'statements.upload',
            'statements.process', 'transactions.view', 'transactions.match',
            'transactions.flag', 'reports.view', 'catalog.view'
        ]),
        ('viewer', 'Solo lectura', [
            'bank_accounts.view', 'statements.view', 'transactions.view',
            'reports.view', 'catalog.view'
        ]),
    ]
    
    created_roles = {}
    for role_name, description, perm_names in roles_data:
        role, _ = Role.objects.get_or_create(
            name=role_name,
            defaults={'description': description}
        )
        created_roles[role_name] = role
        
        # Asignar permisos al rol
        for perm_name in perm_names:
            if perm_name in created_permissions:
                RolePermission.objects.get_or_create(
                    role=role,
                    permission=created_permissions[perm_name]
                )
    
    print(f"  ✓ {len(created_roles)} roles creados con sus permisos")
    return created_roles, created_permissions


def assign_roles_to_user(user, roles):
    """Asignar roles a un usuario"""
    print(f"\nAsignando roles a {user.username}...")
    for role_name, role in roles.items():
        UserRole.objects.get_or_create(user=user, role=role)
        print(f"  ✓ Rol '{role_name}' asignado")


def create_code_catalog():
    """Crear entradas en el catálogo de códigos"""
    print("\nCreando catálogo de códigos...")
    
    # Oficinas
    offices = [
        ('OF_001', 'office', 'Oficina Central La Habana', 'Central Habana'),
        ('OF_002', 'office', 'Oficina Santiago de Cuba', 'Santiago'),
        ('OF_003', 'office', 'Oficina Santa Clara', 'Santa Clara'),
        ('OF_004', 'office', 'Oficina Holguín', 'Holguín'),
        ('OF_005', 'office', 'Oficina Camagüey', 'Camagüey'),
    ]
    
    for code, category, desc, display in offices:
        CodeCatalog.objects.get_or_create(
            code=code,
            category=category,
            defaults={
                'description': desc,
                'display_name': display,
                'is_active': True
            }
        )
    
    # Cuentas bancarias (códigos para decodificación)
    bank_accounts_codes = [
        ('BA_001', 'bank_account', 'Cuenta Principal USD', 'Principal USD'),
        ('BA_002', 'bank_account', 'Cuenta Operaciones CUP', 'Operaciones CUP'),
        ('BA_003', 'bank_account', 'Cuenta Reserva EUR', 'Reserva EUR'),
    ]
    
    for code, category, desc, display in bank_accounts_codes:
        CodeCatalog.objects.get_or_create(
            code=code,
            category=category,
            defaults={
                'description': desc,
                'display_name': display,
                'is_active': True
            }
        )
    
    # Operaciones
    operations = [
        ('OP_001', 'operation', 'Transferencia recibida', 'Transferencia +'),
        ('OP_002', 'operation', 'Transferencia enviada', 'Transferencia -'),
        ('OP_003', 'operation', 'Pago de servicios', 'Pago Servicios'),
        ('OP_004', 'operation', 'Comisión bancaria', 'Comisión'),
        ('OP_005', 'operation', 'Depósito en efectivo', 'Depósito Efectivo'),
        ('OP_006', 'operation', 'Retiro en efectivo', 'Retiro Efectivo'),
        ('OP_007', 'operation', 'Nota de crédito', 'Nota Crédito'),
        ('OP_008', 'operation', 'Nota de débito', 'Nota Débito'),
    ]
    
    for code, category, desc, display in operations:
        CodeCatalog.objects.get_or_create(
            code=code,
            category=category,
            defaults={
                'description': desc,
                'display_name': display,
                'is_active': True
            }
        )
    
    total = CodeCatalog.objects.count()
    print(f"  ✓ {total} entradas en catálogo de códigos")


def create_master_data():
    """Crear datos maestros: Bancos, Oficinas, Cuentas, Operaciones"""
    print("\nCreando datos maestros...")
    
    # Bancos
    banks_data = [
        ('Banco Metropolitano', 'BMETROCUC', 'Cuba'),
        ('BANDEC', 'BDECCCUC', 'Cuba'),
        ('BPA', 'BPACUCUC', 'Cuba'),
    ]
    
    banks = {}
    for name, swift, country in banks_data:
        bank, _ = Bank.objects.get_or_create(
            name=name,
            defaults={'swift_code': swift, 'country': country}
        )
        banks[name] = bank
    
    print(f"  ✓ {len(banks)} bancos creados")
    
    # Oficinas
    offices_data = [
        ('OF_001', 'Oficina Central La Habana'),
        ('OF_002', 'Oficina Santiago de Cuba'),
        ('OF_003', 'Oficina Santa Clara'),
        ('OF_004', 'Oficina Holguín'),
        ('OF_005', 'Oficina Camagüey'),
    ]
    
    offices = {}
    for code, name in offices_data:
        office, _ = Office.objects.get_or_create(
            code=code,
            defaults={'name': name}
        )
        offices[code] = office
    
    print(f"  ✓ {len(offices)} oficinas creadas")
    
    # Cuentas bancarias
    accounts_data = [
        ('BA_001', 'Cuenta Principal USD', 'Banco Metropolitano'),
        ('BA_002', 'Cuenta Operaciones CUP', 'BANDEC'),
        ('BA_003', 'Cuenta Reserva EUR', 'BPA'),
    ]
    
    accounts = {}
    for code, name, bank_name in accounts_data:
        account, _ = BankAccount.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'bank': banks.get(bank_name),
                'is_active': True
            }
        )
        accounts[code] = account
    
    print(f"  ✓ {len(accounts)} cuentas bancarias creadas")
    
    # Operaciones
    operations_data = [
        ('OP_001', 'Transferencia recibida', 'Ingreso por transferencia desde otra entidad'),
        ('OP_002', 'Transferencia enviada', 'Egreso por transferencia a otra entidad'),
        ('OP_003', 'Pago de servicios', 'Pago de servicios básicos'),
        ('OP_004', 'Comisión bancaria', 'Comisión cobrada por el banco'),
        ('OP_005', 'Depósito en efectivo', 'Depósito en ventanilla'),
        ('OP_006', 'Retiro en efectivo', 'Retiro en ventanilla'),
        ('OP_007', 'Nota de crédito', 'Ajuste favorable'),
        ('OP_008', 'Nota de débito', 'Ajuste desfavorable'),
    ]
    
    operations = {}
    for code, name, desc in operations_data:
        operation, _ = Operation.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'description': desc,
                'is_active': True
            }
        )
        operations[code] = operation
    
    print(f"  ✓ {len(operations)} operaciones creadas")
    return banks, offices, accounts, operations


def create_sample_statements(accounts, offices):
    """Crear extractos y transacciones de ejemplo"""
    print("\nCreando extractos y transacciones de ejemplo...")
    
    if not accounts:
        accounts = {code: acc for code, acc in 
                   [(acc.code, acc) for acc in BankAccount.objects.all()]}
    
    if not offices:
        offices = {off.code: off for off in Office.objects.all()}
    
    # Crear un extracto de ejemplo
    account = accounts.get('BA_001')
    if account:
        statement_date = date.today() - timedelta(days=1)
        statement, _ = BankStatement.objects.get_or_create(
            bank_account=account,
            statement_date=statement_date,
            defaults={
                'file_name': 'extracto_ejemplo.csv',
                'file_extension': 'csv',
                'period_start': statement_date - timedelta(days=29),
                'period_end': statement_date,
                'starting_balance': Decimal('100000.0000'),
                'ending_balance': Decimal('125450.5000'),
                'overdraft_balance': None,
                'reserved_balance': Decimal('5000.0000'),
                'available_balance': Decimal('120450.5000'),
                'entry_count': 5
            }
        )
        
        # Crear transacciones de ejemplo
        transactions_data = [
            ('TXN001', None, 'Transferencia recibida - Empresa X', 'OF_001', 'credit', Decimal('50000.0000'), 'USD'),
            ('TXN002', None, 'Pago servicios ETECSA', 'OF_002', 'debit', Decimal('1500.5000'), 'USD'),
            ('TXN003', None, 'Comisión bancaria mensual', 'OF_001', 'debit', Decimal('50.0000'), 'USD'),
            ('TXN004', None, 'Depósito cliente ABC', 'OF_003', 'credit', Decimal('25000.0000'), 'USD'),
            ('TXN005', None, 'Transferencia enviada - Proveedor Y', 'OF_001', 'debit', Decimal('48000.0000'), 'USD'),
        ]
        
        for ref, orig_ref, name, office_code, entry_type, amount, currency in transactions_data:
            BankStatementTransaction.objects.get_or_create(
                bank_statement=statement,
                current_reference=ref,
                defaults={
                    'original_reference': orig_ref,
                    'name': name,
                    'bank_account': account,
                    'office_code': office_code,
                    'entry_type': entry_type,
                    'bank_fee': Decimal('0.0000') if 'Comisión' not in name else Decimal('5.0000'),
                    'amount': amount,
                    'currency': currency
                }
            )
        
        print(f"  ✓ Extracto creado con {statement.transactions.count()} transacciones")


def create_system_settings():
    """Crear configuraciones del sistema por defecto"""
    print("\nCreando configuraciones del sistema...")
    
    settings_data = {
        'company.name': {'value': 'ETECSA', 'desc': 'Nombre de la empresa'},
        'company.currency': {'value': 'USD', 'desc': 'Moneda base'},
        'system.max_upload_size_mb': {'value': 50, 'desc': 'Tamaño máximo de subida (MB)'},
        'statement.auto_process': {'value': False, 'desc': 'Procesamiento automático de extractos'},
        'notification.enabled': {'value': True, 'desc': 'Notificaciones habilitadas'},
    }
    
    for key, data in settings_data.items():
        SystemSetting.objects.update_or_create(
            key=key,
            defaults={'value': data['value']}
        )
    
    print(f"  ✓ {len(settings_data)} configuraciones creadas")


def main():
    """Ejecutar todos los seeds"""
    print("=" * 60)
    print("SEED INICIAL - ETECSA")
    print("=" * 60)
    
    # 1. Superusuario
    admin = create_superuser()
    
    # 2. Roles y permisos
    roles, permissions = create_roles_and_permissions()
    
    # 3. Asignar roles al admin
    assign_roles_to_user(admin, roles)
    
    # 4. Catálogo de códigos
    create_code_catalog()
    
    # 5. Datos maestros
    banks, offices, accounts, operations = create_master_data()
    
    # 6. Extractos de ejemplo
    create_sample_statements(accounts, offices)
    
    # 7. Configuraciones del sistema
    create_system_settings()
    
    print("\n" + "=" * 60)
    print("✓ SEED COMPLETADO EXITOSAMENTE")
    print("=" * 60)
    print("\nCredenciales de admin:")
    print("  Username: admin")
    print("  Password: admin123")
    print("\nRoles disponibles:")
    for role_name in roles.keys():
        print(f"  - {role_name}")
    print("\nPara cambiar la contraseña:")
    print("  python manage.py changepassword admin")
    print("=" * 60)


if __name__ == '__main__':
    main()
