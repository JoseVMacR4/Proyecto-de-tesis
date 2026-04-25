import uuid
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.users.models import User, Role, Permission, UserRole, RolePermission
from apps.bank_accounts.models import CodeCatalog, Office, Bank, BankAccount, Operation, SystemSetting
from apps.transactions.models import BankStatement, BankStatementTransaction
from datetime import date, datetime, timedelta
from decimal import Decimal


class Command(BaseCommand):
    help = 'Carga datos iniciales (seeds) para el sistema'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Iniciando carga de seeds...')

        # 1. Crear usuario admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Usuario admin creado (password: admin123)'))
        else:
            self.stdout.write('Usuario admin ya existe')

        # 2. Crear roles
        roles_data = [
            {'name': 'Admin', 'description': 'Administrador del sistema con acceso completo'},
            {'name': 'Manager', 'description': 'Gerente con acceso a reportes y aprobaciones'},
            {'name': 'Analyst', 'description': 'Analista con acceso a operaciones diarias'},
            {'name': 'Viewer', 'description': 'Solo lectura'},
        ]
        
        roles = {}
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )
            roles[role_data['name']] = role
            if created:
                self.stdout.write(f'Rol {role_data["name"]} creado')
            else:
                self.stdout.write(f'Rol {role_data["name"]} ya existe')

        # 3. Crear permisos
        permissions_data = [
            {'name': 'users.view', 'description': 'Ver usuarios'},
            {'name': 'users.create', 'description': 'Crear usuarios'},
            {'name': 'users.edit', 'description': 'Editar usuarios'},
            {'name': 'users.delete', 'description': 'Eliminar usuarios'},
            {'name': 'bank_accounts.view', 'description': 'Ver cuentas bancarias'},
            {'name': 'bank_accounts.create', 'description': 'Crear cuentas bancarias'},
            {'name': 'bank_accounts.edit', 'description': 'Editar cuentas bancarias'},
            {'name': 'bank_accounts.delete', 'description': 'Eliminar cuentas bancarias'},
            {'name': 'transactions.view', 'description': 'Ver transacciones'},
            {'name': 'transactions.create', 'description': 'Crear transacciones'},
            {'name': 'transactions.reconcile', 'description': 'Conciliar transacciones'},
            {'name': 'reports.view', 'description': 'Ver reportes'},
            {'name': 'reports.create', 'description': 'Crear reportes'},
            {'name': 'reports.export', 'description': 'Exportar reportes'},
            {'name': 'settings.view', 'description': 'Ver configuraciones'},
            {'name': 'settings.edit', 'description': 'Editar configuraciones'},
        ]
        
        permissions = {}
        for perm_data in permissions_data:
            perm, created = Permission.objects.get_or_create(
                name=perm_data['name'],
                defaults={'description': perm_data['description']}
            )
            permissions[perm_data['name']] = perm
            if created:
                self.stdout.write(f'Permiso {perm_data["name"]} creado')
            else:
                self.stdout.write(f'Permiso {perm_data["name"]} ya existe')

        # 4. Asignar permisos a roles
        role_permissions_map = {
            'Admin': list(permissions.keys()),
            'Manager': [
                'users.view', 'bank_accounts.view', 'transactions.view',
                'reports.view', 'reports.create', 'reports.export',
                'settings.view', 'transactions.reconcile'
            ],
            'Analyst': [
                'users.view', 'bank_accounts.view', 'transactions.view',
                'transactions.create', 'transactions.reconcile', 'reports.view'
            ],
            'Viewer': ['users.view', 'bank_accounts.view', 'transactions.view', 'reports.view'],
        }
        
        for role_name, perm_names in role_permissions_map.items():
            role = roles[role_name]
            for perm_name in perm_names:
                RolePermission.objects.get_or_create(role=role, permission=permissions[perm_name])
        
        self.stdout.write(self.style.SUCCESS('Permisos asignados a roles'))

        # 5. Asignar rol Admin al usuario admin
        UserRole.objects.get_or_create(user=admin, role=roles['Admin'])
        self.stdout.write('Rol Admin asignado al usuario admin')

        # 6. Crear catálogo de códigos
        code_catalog_data = [
            # Oficinas
            {'code': 'OF_001', 'category': 'office', 'description': 'Oficina Central', 'display_name': 'Central'},
            {'code': 'OF_002', 'category': 'office', 'description': 'Oficina Habana', 'display_name': 'Habana'},
            {'code': 'OF_003', 'category': 'office', 'description': 'Oficina Santiago', 'display_name': 'Santiago'},
            # Cuentas bancarias
            {'code': 'BA_001', 'category': 'bank_account', 'description': 'Cuenta Principal BM', 'display_name': 'Principal BM'},
            {'code': 'BA_002', 'category': 'bank_account', 'description': 'Cuenta Secundaria BM', 'display_name': 'Secundaria BM'},
            {'code': 'BA_003', 'category': 'bank_account', 'description': 'Cuenta BANDEC', 'display_name': 'Cuenta BANDEC'},
            # Operaciones
            {'code': 'OP_001', 'category': 'operation', 'description': 'Transferencia', 'display_name': 'Transferencia'},
            {'code': 'OP_002', 'category': 'operation', 'description': 'Depósito', 'display_name': 'Depósito'},
            {'code': 'OP_003', 'category': 'operation', 'description': 'Retiro', 'display_name': 'Retiro'},
            {'code': 'OP_004', 'category': 'operation', 'description': 'Pago', 'display_name': 'Pago'},
            {'code': 'OP_005', 'category': 'operation', 'description': 'Comisión', 'display_name': 'Comisión'},
        ]
        
        for code_data in code_catalog_data:
            CodeCatalog.objects.update_or_create(
                code=code_data['code'],
                defaults={
                    'category': code_data['category'],
                    'description': code_data['description'],
                    'display_name': code_data['display_name'],
                }
            )
        
        self.stdout.write(self.style.SUCCESS('Catálogo de códigos cargado'))

        # 7. Crear oficinas
        offices_data = [
            {'code': 'OF_001', 'name': 'Oficina Central'},
            {'code': 'OF_002', 'name': 'Oficina Habana'},
            {'code': 'OF_003', 'name': 'Oficina Santiago'},
        ]
        
        offices = {}
        for office_data in offices_data:
            office, created = Office.objects.get_or_create(
                code=office_data['code'],
                defaults={'name': office_data['name']}
            )
            offices[office_data['code']] = office
            if created:
                self.stdout.write(f'Oficina {office_data["name"]} creada')
            else:
                self.stdout.write(f'Oficina {office_data["name"]} ya existe')

        # 8. Crear bancos
        banks_data = [
            {'name': 'Banco Metropolitano', 'swift_code': 'METACUHH', 'country': 'Cuba'},
            {'name': 'BANDEC', 'swift_code': 'BDECCUHH', 'country': 'Cuba'},
            {'name': 'BPA', 'swift_code': 'BPACCUHH', 'country': 'Cuba'},
        ]
        
        banks = {}
        for bank_data in banks_data:
            bank, created = Bank.objects.get_or_create(
                name=bank_data['name'],
                defaults={
                    'swift_code': bank_data['swift_code'],
                    'country': bank_data['country'],
                }
            )
            banks[bank_data['name']] = bank
            if created:
                self.stdout.write(f'Banco {bank_data["name"]} creado')
            else:
                self.stdout.write(f'Banco {bank_data["name"]} ya existe')

        # 9. Crear cuentas bancarias
        bank_accounts_data = [
            {'code': 'BA_001', 'name': 'Cuenta Principal BM', 'bank': banks['Banco Metropolitano']},
            {'code': 'BA_002', 'name': 'Cuenta Secundaria BM', 'bank': banks['Banco Metropolitano']},
            {'code': 'BA_003', 'name': 'Cuenta BANDEC', 'bank': banks['BANDEC']},
        ]
        
        bank_accounts = {}
        for ba_data in bank_accounts_data:
            ba, created = BankAccount.objects.get_or_create(
                code=ba_data['code'],
                defaults={
                    'name': ba_data['name'],
                    'bank': ba_data['bank'],
                }
            )
            bank_accounts[ba_data['code']] = ba
            if created:
                self.stdout.write(f'Cuenta {ba_data["name"]} creada')
            else:
                self.stdout.write(f'Cuenta {ba_data["name"]} ya existe')

        # 10. Crear operaciones
        operations_data = [
            {'code': 'OP_001', 'name': 'Transferencia'},
            {'code': 'OP_002', 'name': 'Depósito'},
            {'code': 'OP_003', 'name': 'Retiro'},
            {'code': 'OP_004', 'name': 'Pago'},
            {'code': 'OP_005', 'name': 'Comisión'},
        ]
        
        for op_data in operations_data:
            Operation.objects.get_or_create(
                code=op_data['code'],
                defaults={'name': op_data['name']}
            )
        
        self.stdout.write(self.style.SUCCESS('Operaciones creadas'))

        # 11. Crear configuración del sistema
        settings_data = [
            {'key': 'system.currency', 'value': 'CUP'},
            {'key': 'system.decimal_places', 'value': 4},
            {'key': 'system.date_format', 'value': '%Y-%m-%d'},
            {'key': 'system.timezone', 'value': 'UTC'},
        ]
        
        for setting_data in settings_data:
            SystemSetting.objects.update_or_create(
                key=setting_data['key'],
                defaults={'value': setting_data['value']}
            )
        
        self.stdout.write(self.style.SUCCESS('Configuraciones del sistema creadas'))

        # 12. Crear estados de cuenta de ejemplo
        today = date.today()
        first_day_current_month = today.replace(day=1)
        last_day_prev_month = first_day_current_month - timedelta(days=1)
        first_day_prev_month = last_day_prev_month.replace(day=1)
        
        statements_data = [
            {
                'bank_account': bank_accounts['BA_001'],
                'file_name': 'statement_2024_01',
                'file_extension': 'pdf',
                'statement_date': last_day_prev_month,
                'period_start': first_day_prev_month,
                'period_end': last_day_prev_month,
                'starting_balance': Decimal('100000.0000'),
                'ending_balance': Decimal('125000.0000'),
                'overdraft_balance': Decimal('0.0000'),
                'reserved_balance': Decimal('5000.0000'),
                'available_balance': Decimal('120000.0000'),
                'entry_count': 15,
            },
            {
                'bank_account': bank_accounts['BA_001'],
                'file_name': 'statement_2024_02',
                'file_extension': 'pdf',
                'statement_date': first_day_current_month - timedelta(days=1),
                'period_start': first_day_current_month,
                'period_end': first_day_current_month + timedelta(days=28),
                'starting_balance': Decimal('125000.0000'),
                'ending_balance': Decimal('150000.0000'),
                'overdraft_balance': Decimal('0.0000'),
                'reserved_balance': Decimal('7500.0000'),
                'available_balance': Decimal('142500.0000'),
                'entry_count': 20,
            },
        ]
        
        statements = []
        for stmt_data in statements_data:
            statement, created = BankStatement.objects.get_or_create(
                bank_account=stmt_data['bank_account'],
                statement_date=stmt_data['statement_date'],
                defaults=stmt_data
            )
            statements.append(statement)
            if created:
                self.stdout.write(f'Estado de cuenta {stmt_data["file_name"]} creado')
            else:
                self.stdout.write(f'Estado de cuenta {stmt_data["file_name"]} ya existe')

        # 13. Crear transacciones de ejemplo
        transactions_data = [
            {
                'bank_statement': statements[0] if len(statements) > 0 else None,
                'current_reference': 'TXN_001',
                'original_reference': 'ORG_001',
                'name': 'Transferencia desde OF_001',
                'bank_account': bank_accounts['BA_001'],
                'office_code': 'OF_001',
                'entry_type': 'credit',
                'bank_fee': Decimal('0.0000'),
                'amount': Decimal('5000.0000'),
                'currency': 'CUP',
            },
            {
                'bank_statement': statements[0] if len(statements) > 0 else None,
                'current_reference': 'TXN_002',
                'original_reference': None,
                'name': 'Pago a proveedor',
                'bank_account': bank_accounts['BA_001'],
                'office_code': 'OF_002',
                'entry_type': 'debit',
                'bank_fee': Decimal('10.0000'),
                'amount': Decimal('2500.0000'),
                'currency': 'CUP',
            },
            {
                'bank_statement': statements[0] if len(statements) > 0 else None,
                'current_reference': 'TXN_003',
                'original_reference': 'ORG_003',
                'name': 'Depósito en efectivo',
                'bank_account': bank_accounts['BA_001'],
                'office_code': 'OF_001',
                'entry_type': 'credit',
                'bank_fee': Decimal('0.0000'),
                'amount': Decimal('10000.0000'),
                'currency': 'CUP',
            },
        ]
        
        for txn_data in transactions_data:
            if txn_data['bank_statement']:
                BankStatementTransaction.objects.get_or_create(
                    current_reference=txn_data['current_reference'],
                    defaults=txn_data
                )
        
        self.stdout.write(self.style.SUCCESS('Transacciones de ejemplo creadas'))

        self.stdout.write(self.style.SUCCESS('\n=== Seeds cargados exitosamente ==='))
        self.stdout.write(self.style.WARNING('Usuario admin: admin / Password: admin123'))
