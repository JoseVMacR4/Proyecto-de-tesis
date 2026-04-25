# Documentación del Proyecto - Django + PostgreSQL

## Resumen Ejecutivo

Sistema de gestión financiera con Django + PostgreSQL, incluyendo:
- RBAC (Role-Based Access Control) por recurso
- Auditoría centralizada
- Gestión de cuentas bancarias, estados de cuenta y transacciones
- Seeds iniciales para pruebas

---

## 1. ERD Formal (Entity Relationship Diagram)

### Entidades y Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS APP                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│  │    User      │◄───────►│   UserRole   │◄───────►│     Role     │            │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤            │
│  │ id (PK)      │         │ user_id (FK) │         │ id (PK)      │            │
│  │ username     │         │ role_id (FK) │         │ name         │            │
│  │ email        │         │ created_at   │         │ description  │            │
│  │ password_hash│         └──────────────┘         │ created_at   │            │
│  │ is_active    │                                   │ updated_at   │            │
│  │ is_staff     │                                   └──────────────┘            │
│  │ first_name   │                                          ▲                     │
│  │ last_name    │                                          │                     │
│  │ created_at   │                                          │                     │
│  │ updated_at   │         ┌──────────────┐         ┌───────┴───────┐            │
│  └──────────────┘         │RolePermission│◄───────►│  Permission   │            │
│         │                 ├──────────────┤         ├───────────────┤            │
│         │                 │ role_id (FK) │         │ id (PK)       │            │
│         │                 │ permission_  │         │ name          │            │
│         │                 │   id (FK)    │         │ description   │            │
│         │                 │ created_at   │         │ created_at    │            │
│         │                 └──────────────┘         │ updated_at    │            │
│         │                                          └───────────────┘            │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│  │  AuditLog    │         │   Reminder   │         │ Notification │            │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤            │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │            │
│  │ actor_id(FK) │         │ title        │         │ user_id (FK) │            │
│  │ action       │         │ message      │         │ type         │            │
│  │ resource     │         │ due_at       │         │ content      │            │
│  │ resource_id  │         │ user_id (FK) │         │ read_at      │            │
│  │ timestamp    │         │ status       │         │ created_at   │            │
│  │ details      │         │ created_at   │         └──────────────┘            │
│  └──────────────┘         │ updated_at   │                                      │
│                           └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               BANK_ACCOUNTS APP                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│  │CodeCatalog   │         │    Office    │         │     Bank     │            │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤            │
│  │ code (PK)    │         │ id (PK)      │         │ id (PK)      │            │
│  │ category     │         │ code         │         │ name         │            │
│  │ description  │         │ name         │         │ swift_code   │            │
│  │ display_name │         │ created_at   │         │ country      │            │
│  │ created_at   │         │ updated_at   │         │ created_at   │            │
│  │ updated_at   │         └──────────────┘         │ updated_at   │            │
│  └──────────────┘                                   └──────────────┘            │
│                                                    │                             │
│                                                    ▼                             │
│                                           ┌──────────────┐                       │
│                                           │BankAccount   │                       │
│                                           ├──────────────┤                       │
│                                           │ id (PK)      │                       │
│                                           │ code         │                       │
│                                           │ name         │                       │
│                                           │ bank_id (FK) │                       │
│                                           │ created_at   │                       │
│                                           │ updated_at   │                       │
│                                           └──────────────┘                       │
│                                                  │                                 │
│                    ┌─────────────────────────────┼─────────────────────────────┐ │
│                    │                             │                             │ │
│                    ▼                             ▼                             │ │
│           ┌──────────────┐              ┌──────────────┐                       │ │
│           │AccountState  │              │BankStatement │                       │ │
│           ├──────────────┤              ├──────────────┤                       │ │
│           │ id (PK)      │              │ id (PK)      │                       │ │
│           │bank_account_ │              │bank_account_ │                       │ │
│           │  id (FK)     │              │  id (FK)     │                       │ │
│           │ period_start │              │ file_name    │                       │ │
│           │ period_end   │              │ file_ext     │                       │ │
│           │ balance      │              │ statement_dt │                       │ │
│           │reconciled_at │              │ period_start │                       │ │
│           │ created_at   │              │ period_end   │                       │ │
│           │ updated_at   │              │ balances...  │                       │ │
│           └──────────────┘              │ created_at   │                       │ │
│                                         │ updated_at   │                       │ │
│                                         └──────────────┘                       │ │
│                                                │                                 │
│                                                ▼                                 │
│                                      ┌──────────────────┐                        │
│                                      │BankStatementTxn  │                        │
│                                      ├──────────────────┤                        │
│                                      │ id (PK)          │                        │
│                                      │statement_id (FK) │                        │
│                                      │current_reference │                        │
│                                      │original_reference│                        │
│                                      │ name             │                        │
│                                      │bank_account(FK)  │                        │
│                                      │ office_code      │                        │
│                                      │ entry_type       │                        │
│                                      │ bank_fee         │                        │
│                                      │ amount           │                        │
│                                      │ currency         │                        │
│                                      │ created_at       │                        │
│                                      │ updated_at       │                        │
│                                      └──────────────────┘                        │
│                                                                                    │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│  │  Operation   │         │SystemSetting │         │    Report    │            │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤            │
│  │ id (PK)      │         │ key (PK)     │         │ id (PK)      │            │
│  │ code         │         │ value (JSON) │         │ name         │            │
│  │ name         │         │ updated_at   │         │ type         │            │
│  │ created_at   │         └──────────────┘         │created_by(FK)│            │
│  │ updated_at   │                                   │ created_at   │            │
│  └──────────────┘                                   │ updated_at   │            │
│                                                     │ filters(JSON)│            │
│                                                     └──────────────┘            │
│                                                            │                     │
│                                                            ▼                     │
│                                                     ┌──────────────┐            │
│                                                     │  ReportRun   │            │
│                                                     ├──────────────┤            │
│                                                     │ id (PK)      │            │
│                                                     │report_id (FK)│            │
│                                                     │ run_at       │            │
│                                                     │ generated_at │            │
│                                                     │ status       │            │
│                                                     │result_location│           │
│                                                     └──────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Tabla de Relaciones

| Relación | Tipo | Descripción |
|----------|------|-------------|
| User ↔ Role | Many-to-Many | Usuarios pueden tener múltiples roles |
| Role ↔ Permission | Many-to-Many | Roles pueden tener múltiples permisos |
| User → AuditLog | One-to-Many | Un usuario genera múltiples logs |
| User → Reminder | One-to-Many | Un usuario tiene múltiples recordatorios |
| User → Notification | One-to-Many | Un usuario recibe múltiples notificaciones |
| Bank → BankAccount | One-to-Many | Un banco tiene múltiples cuentas |
| BankAccount → BankStatement | One-to-Many | Una cuenta tiene múltiples estados |
| BankAccount → AccountState | One-to-Many | Una cuenta tiene múltiples estados históricos |
| BankStatement → BankStatementTransaction | One-to-Many | Un estado tiene múltiples transacciones |
| Report → ReportRun | One-to-Many | Un reporte tiene múltiples ejecuciones |

---

## 2. Modelos Django por App

### Apps/users/models.py

```python
User (AbstractBaseUser, PermissionsMixin)
├── id: UUID PK
├── username: VARCHAR(150) UNIQUE
├── email: EmailField UNIQUE (nullable)
├── password_hash: VARCHAR(255)
├── is_active: BOOLEAN
├── is_staff: BOOLEAN
├── first_name: VARCHAR(100)
├── last_name: VARCHAR(100)
├── created_at: DateTime
└── updated_at: DateTime

Role
├── id: UUID PK
├── name: VARCHAR(100) UNIQUE
├── description: VARCHAR(255)
├── created_at: DateTime
└── updated_at: DateTime

Permission
├── id: UUID PK
├── name: VARCHAR(100) UNIQUE
├── description: VARCHAR(255)
├── created_at: DateTime
└── updated_at: DateTime

UserRole
├── user: FK → User
├── role: FK → Role
├── created_at: DateTime
└── PK: (user, role)

RolePermission
├── role: FK → Role
├── permission: FK → Permission
├── created_at: DateTime
└── PK: (role, permission)

AuditLog
├── id: UUID PK
├── actor: FK → User (nullable)
├── action: VARCHAR(50)
├── resource: VARCHAR(100)
├── resource_id: VARCHAR(100)
├── timestamp: DateTime
└── details: JSONB

Reminder
├── id: UUID PK
├── title: VARCHAR(200)
├── message: TEXT
├── due_at: DateTime
├── user: FK → User
├── status: VARCHAR (pending/sent/dismissed/completed)
├── created_at: DateTime
└── updated_at: DateTime

Notification
├── id: UUID PK
├── user: FK → User
├── type: VARCHAR (info/warning/error)
├── content: TEXT
├── read_at: DateTime (nullable)
└── created_at: DateTime
```

### Apps/bank_accounts/models.py

```python
CodeCatalog
├── code: VARCHAR(50) PK
├── category: VARCHAR(50)
├── description: VARCHAR(255)
├── display_name: VARCHAR(100)
├── created_at: DateTime
└── updated_at: DateTime

Office
├── id: UUID PK
├── code: VARCHAR(50) UNIQUE
├── name: VARCHAR(200)
├── created_at: DateTime
└── updated_at: DateTime

Bank
├── id: UUID PK
├── name: VARCHAR(200)
├── swift_code: VARCHAR(50)
├── country: VARCHAR(100)
├── created_at: DateTime
└── updated_at: DateTime

BankAccount
├── id: UUID PK
├── code: VARCHAR(50) UNIQUE
├── name: VARCHAR(200)
├── bank: FK → Bank (nullable)
├── created_at: DateTime
└── updated_at: DateTime

Operation
├── id: UUID PK
├── code: VARCHAR(50) UNIQUE
├── name: VARCHAR(200)
├── created_at: DateTime
└── updated_at: DateTime

AccountState
├── id: UUID PK
├── bank_account: FK → BankAccount
├── period_start: Date
├── period_end: Date
├── balance: DECIMAL(20,4)
├── reconciled_at: DateTime
├── created_at: DateTime
└── updated_at: DateTime

SystemSetting
├── key: VARCHAR(100) PK
├── value: JSONB
└── updated_at: DateTime

Report
├── id: UUID PK
├── name: VARCHAR(200)
├── type: VARCHAR (financial/compliance/custom)
├── created_by: FK → User
├── created_at: DateTime
├── updated_at: DateTime
└── filters: JSONB

ReportRun
├── id: UUID PK
├── report: FK → Report
├── run_at: DateTime
├── generated_at: DateTime
├── status: VARCHAR (pending/completed/failed)
├── result_location: VARCHAR(500)
└── created_at: DateTime
```

### Apps/transactions/models.py

```python
BankStatement
├── id: UUID PK
├── bank_account: FK → BankAccount
├── file_name: VARCHAR(255)
├── file_extension: VARCHAR(10)
├── statement_date: Date
├── period_start: Date
├── period_end: Date
├── starting_balance: DECIMAL(20,4)
├── ending_balance: DECIMAL(20,4)
├── overdraft_balance: DECIMAL(20,4)
├── reserved_balance: DECIMAL(20,4)
├── available_balance: DECIMAL(20,4)
├── entry_count: Integer
├── created_at: DateTime
└── updated_at: DateTime

BankStatementTransaction
├── id: UUID PK
├── bank_statement: FK → BankStatement
├── current_reference: VARCHAR(100)
├── original_reference: VARCHAR(100)
├── name: VARCHAR(255)
├── bank_account: FK → BankAccount
├── office_code: VARCHAR(50)
├── entry_type: VARCHAR (credit/debit)
├── bank_fee: DECIMAL(20,4)
├── amount: DECIMAL(20,4)
├── currency: VARCHAR(3)
├── created_at: DateTime
└── updated_at: DateTime
```

---

## 3. Plan de Migraciones

### Migraciones Creadas

1. **users.0001_initial**
   - Create model: Permission, Role, User
   - Create model: Notification, Reminder, AuditLog
   - Create model: RolePermission, UserRole

2. **bank_accounts.0001_initial**
   - Create model: Bank, CodeCatalog, Office, Operation
   - Create model: SystemSetting, BankAccount
   - Create model: Report, ReportRun, AccountState

3. **transactions.0001_initial**
   - Create model: BankStatement
   - Create model: BankStatementTransaction
   - Índices en campos de búsqueda

### Ejecutar Migraciones

```bash
python manage.py makemigrations users
python manage.py makemigrations bank_accounts
python manage.py makemigrations transactions
python manage.py migrate
```

---

## 4. Seeds Iniciales

### Comando de Seeds

```bash
python manage.py load_seeds
```

### Datos Cargados

1. **Usuario Admin**
   - Username: `admin`
   - Password: `admin123`
   - Email: `admin@example.com`

2. **Roles**
   - Admin (acceso completo)
   - Manager (reportes y aprobaciones)
   - Analyst (operaciones diarias)
   - Viewer (solo lectura)

3. **Permisos** (16 permisos)
   - users.view, users.create, users.edit, users.delete
   - bank_accounts.view, bank_accounts.create, bank_accounts.edit, bank_accounts.delete
   - transactions.view, transactions.create, transactions.reconcile
   - reports.view, reports.create, reports.export
   - settings.view, settings.edit

4. **Catálogo de Códigos**
   - Oficinas: OF_001, OF_002, OF_003
   - Cuentas: BA_001, BA_002, BA_003
   - Operaciones: OP_001 a OP_005

5. **Datos Maestros**
   - 3 Bancos (Metropolitano, BANDEC, BPA)
   - 3 Oficinas
   - 3 Cuentas bancarias
   - 5 Operaciones

6. **Configuraciones**
   - system.currency: CUP
   - system.decimal_places: 4
   - system.date_format: %Y-%m-%d
   - system.timezone: UTC

7. **Datos de Ejemplo**
   - 2 Estados de cuenta
   - 3 Transacciones de ejemplo

---

## 5. Guía de Implementación Paso a Paso

### Paso 1: Configuración del Entorno

```bash
# Instalar dependencias
pip install django psycopg2-binary django-bootstrap5

# Configurar DATABASES en settings.py para PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tu_base_de_datos',
        'USER': 'tu_usuario',
        'PASSWORD': 'tu_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Paso 2: Ejecutar Migraciones

```bash
cd /workspace/projectETECSA
python manage.py makemigrations
python manage.py migrate
```

### Paso 3: Cargar Seeds

```bash
python manage.py load_seeds
```

### Paso 4: Crear Superusuario (opcional, ya existe admin)

```bash
python manage.py createsuperuser
```

### Paso 5: Ejecutar Servidor

```bash
python manage.py runserver
```

Acceder a:
- Admin: http://localhost:8000/admin/
- Login: admin / admin123

---

## 6. RBAC (Role-Based Access Control)

### Implementación

El sistema RBAC se implementa mediante:

1. **Modelos**: User, Role, Permission, UserRole, RolePermission
2. **Decoradores personalizados** para vistas
3. **Middleware** para verificación de permisos

### Ejemplo de Decorador

```python
# apps/users/permissions.py
from functools import wraps
from django.core.exceptions import PermissionDenied

def permission_required(permission_name):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('login')
            
            user_permissions = Permission.objects.filter(
                rolepermission__role__in=request.user.roles.all()
            ).values_list('name', flat=True)
            
            if permission_name not in user_permissions:
                raise PermissionDenied
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

# Uso en vistas
@permission_required('bank_accounts.view')
def bank_account_list(request):
    ...
```

### Matriz de Permisos por Rol

| Permiso | Admin | Manager | Analyst | Viewer |
|---------|-------|---------|---------|--------|
| users.view | ✓ | ✓ | ✓ | ✓ |
| users.create | ✓ | ✗ | ✗ | ✗ |
| users.edit | ✓ | ✗ | ✗ | ✗ |
| users.delete | ✓ | ✗ | ✗ | ✗ |
| bank_accounts.view | ✓ | ✓ | ✓ | ✓ |
| bank_accounts.create | ✓ | ✗ | ✗ | ✗ |
| transactions.view | ✓ | ✓ | ✓ | ✓ |
| transactions.create | ✓ | ✗ | ✓ | ✗ |
| transactions.reconcile | ✓ | ✓ | ✓ | ✗ |
| reports.view | ✓ | ✓ | ✓ | ✓ |
| reports.create | ✓ | ✓ | ✗ | ✗ |
| reports.export | ✓ | ✓ | ✗ | ✗ |
| settings.view | ✓ | ✓ | ✗ | ✗ |
| settings.edit | ✓ | ✗ | ✗ | ✗ |

---

## 7. Auditoría

### Implementación

El modelo `AuditLog` registra todas las acciones importantes:

```python
# Ejemplo de uso en una vista
from apps.users.models import AuditLog

def create_bank_account(request):
    if request.method == 'POST':
        # ... lógica de creación
        account = BankAccount.objects.create(**data)
        
        # Registrar auditoría
        AuditLog.objects.create(
            actor=request.user,
            action='CREATE',
            resource='BankAccount',
            resource_id=str(account.id),
            details={'code': account.code, 'name': account.name}
        )
```

### Campos de AuditLog

- `actor`: Usuario que realizó la acción
- `action`: Tipo de acción (CREATE, UPDATE, DELETE, VIEW)
- `resource`: Nombre del recurso afectado
- `resource_id`: ID del recurso
- `timestamp`: Fecha y hora automática
- `details`: JSON con detalles adicionales

---

## 8. Estructura de Directorios Final

```
projectETECSA/
├── core/
│   ├── settings.py          # Configuración Django
│   ├── urls.py              # URLs principales
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/
│   │   ├── models.py        # User, Role, Permission, etc.
│   │   ├── admin.py         # Admin registrado
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── load_seeds.py
│   │   └── migrations/
│   ├── bank_accounts/
│   │   ├── models.py        # Bank, Office, etc.
│   │   ├── admin.py
│   │   └── ...
│   ├── transactions/
│   │   ├── models.py        # BankStatement, etc.
│   │   ├── admin.py
│   │   └── ...
│   └── reconciliation/
│       ├── models.py
│       └── ...
├── manage.py
└── db.sqlite3
```

---

## 9. Próximos Pasos Recomendados

1. **Configurar PostgreSQL** para producción
2. **Implementar autenticación** con login/logout views
3. **Crear templates** con Bootstrap 5
4. **Implementar decoradores RBAC** en todas las vistas
5. **Agregar logging** de auditoría en operaciones CRUD
6. **Crear APIs REST** (opcional, con Django REST Framework)
7. **Configurar backups** automáticos de base de datos
8. **Implementar tests** unitarios y de integración

---

## 10. Comandos Útiles

```bash
# Ejecutar migraciones
python manage.py migrate

# Crear nuevas migraciones
python manage.py makemigrations

# Cargar seeds
python manage.py load_seeds

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver

# Recopilar estáticos
python manage.py collectstatic

# Shell de Django
python manage.py shell

# Ver logs de migraciones
python manage.py showmigrations
```

---

## Contacto y Soporte

Para dudas o problemas, revisar:
- Django Documentation: https://docs.djangoproject.com/
- Django Admin: http://localhost:8000/admin/
