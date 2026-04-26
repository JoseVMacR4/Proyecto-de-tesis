# Banking Reconciliation System - Documentation

## 📋 Configuración de Settings

### INSTALLED_APPS Actualizado
```python
INSTALLED_APPS = [
    # Django contrib apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps del sistema
    'core',           # CodeCatalog, SystemSetting, AuditLog
    'users',          # User, Role, Permission, UserRole, RolePermission, Notification, Reminder
    'bankaccounts',   # Bank, BankAccount, Office, AccountState, Operation
    'reconciliation', # BankStatement, BankStatementTransaction
    'reporting',      # Report, ReportRun (renombrado desde 'transactions')
]
```

### AUTH_USER_MODEL
```python
AUTH_USER_MODEL = 'users.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

---

## 🔄 Mapa de Actualización: `transactions` → `reporting`

### 1. Settings (`settings.py`)
- ❌ `'transactions'` 
- ✅ `'reporting'`

### 2. Templates
| Antes | Después |
|-------|---------|
| `templates/transactions/list.html` | `templates/reporting/list.html` |
| `{% include 'transactions/_header.html' %}` | `{% include 'reporting/_header.html' %}` |
| `templates/transactions/` (namespace) | `templates/reporting/` (namespace) |

### 3. Estáticos
| Antes | Después |
|-------|---------|
| `static/transactions/css/styles.css` | `static/reporting/css/styles.css` |
| `static/transactions/js/reports.js` | `static/reporting/js/reports.js` |
| `{% static 'transactions/css/styles.css' %}` | `{% static 'reporting/css/styles.css' %}` |

### 4. URLs (`urls.py`)
```python
# Antes
path('transactions/', include('transactions.urls'))

# Después
path('reports/', include('reporting.urls'))
```

En `reporting/urls.py`:
```python
app_name = 'reporting'  # Namespace para reverse()
```

### 5. Vistas y Código Python
| Antes | Después |
|-------|---------|
| `from transactions.models import Report` | `from reporting.models import Report` |
| `reverse('transactions:report_list')` | `reverse('reporting:report_list')` |
| `get_template('transactions/report.html')` | `get_template('reporting/report.html')` |

### 6. Migraciones existentes
Si ya existía la app `transactions`:
```bash
# 1. Renombrar directorio
mv transactions reporting

# 2. Crear nueva migración para actualizar ContentType
python manage.py makemigrations

# 3. Ejecutar migración con fake inicial si es necesario
python manage.py migrate --fake-initial
```

---

## ✅ Checklist de Validación

### Configuración Base
- [x] `AUTH_USER_MODEL = 'users.User'` configurado en settings
- [x] `DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'` configurado
- [x] Todas las apps registradas en `INSTALLED_APPS`

### Modelos y Campos
- [x] Todos los UUID con `default=uuid.uuid4, editable=False`
- [x] PKs CharField para `CodeCatalog.code` y `SystemSetting.key`
- [x] FKs con `on_delete` explícito (`PROTECT` o `SET_NULL`)
- [x] Todas las FKs usan referencias en string: `'app_name.ModelName'`
- [x] `created_at` con `auto_now_add=True`
- [x] `updated_at` con `auto_now=True`
- [x] Campos monetarios: `DecimalField(max_digits=20, decimal_places=4)`
- [x] Moneda: `CharField(max_length=3)`

### Meta & Índices
- [x] `__str__` implementado en todos los modelos
- [x] `Meta.verbose_name` y `Meta.verbose_name_plural` en todos
- [x] `Meta.ordering` definido según corresponda
- [x] `Meta.indexes` para consultas frecuentes:
  - [x] `code`, `statement_date`, `status`, `timestamp`
  - [x] Campos de búsqueda y filtrado común

### Integridad Referencial
- [x] Sin `CASCADE` en datos financieros o de extractos
- [x] `PROTECT` para entidades críticas (Bank, BankAccount, Operation)
- [x] `SET_NULL(null=True)` para logs, notificaciones, relaciones opcionales

### Auditoría & RBAC
- [x] `AuditLog` en `core` con campos `resource` y `resource_id`
- [x] Convención: `resource='bankaccounts.BankAccount'`, `resource_id` como string UUID
- [x] Documentación de señales `post_save`/`post_delete` en comentarios

### Renombrado transactions → reporting
- [x] App renombrada en `INSTALLED_APPS`
- [x] Directorio `reporting/` creado con `models.py`
- [x] Documentación de actualización de templates, estáticos y URLs

### Internacionalización
- [x] `gettext_lazy` usado en `verbose_name` y choices
- [x] `LANGUAGE_CODE = 'es-es'` configurado

---

## 🚀 Comandos de Validación

```bash
# 1. Verificar configuración
python manage.py check

# 2. Generar migraciones
python manage.py makemigrations core users bankaccounts reconciliation reporting

# 3. Ver SQL generado (opcional)
python manage.py sqlmigrate core 0001_initial

# 4. Aplicar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Ejecutar tests (si existen)
python manage.py test
```

---

## 📁 Estructura de Directorios

```
/workspace/
├── project/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/
│   ├── __init__.py
│   └── models.py          # CodeCatalog, SystemSetting, AuditLog
├── users/
│   ├── __init__.py
│   └── models.py          # User, Role, Permission, UserRole, RolePermission, Notification, Reminder
├── bankaccounts/
│   ├── __init__.py
│   └── models.py          # Bank, BankAccount, Office, AccountState, Operation
├── reconciliation/
│   ├── __init__.py
│   └── models.py          # BankStatement, BankStatementTransaction
├── reporting/
│   ├── __init__.py
│   └── models.py          # Report, ReportRun
├── templates/
│   ├── core/
│   ├── users/
│   ├── bankaccounts/
│   ├── reconciliation/
│   └── reporting/         # ← Namespace por app
├── static/
│   ├── core/
│   ├── users/
│   ├── bankaccounts/
│   ├── reconciliation/
│   └── reporting/         # ← Namespace por app
└── media/
```

---

## 🔧 Implementación de Auditoría (Ejemplo)

Crear `core/signals.py`:

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import AuditLog

@receiver(post_save)
def audit_create_update(sender, instance, created, raw, **kwargs):
    if raw or sender == AuditLog:
        return
    
    # Obtener usuario del contexto (implementar thread-local o middleware)
    user_id = get_current_user_id()  # Implementar según tu arquitectura
    
    action = 'CREATE' if created else 'UPDATE'
    AuditLog.objects.create(
        actor_id_id=user_id,
        action=action,
        resource=f'{sender._meta.app_label}.{sender._meta.model_name}',
        resource_id=str(instance.pk),
        details={}
    )
```

---

## ⚠️ Notas Importantes

1. **User.password**: El campo `password` en el modelo `User` debe gestionarse exclusivamente con `set_password()` y `check_password()`. Nunca almacenar en texto plano.

2. **BankStatementTransaction.date**: Implementado como `@property` que deriva de `bank_statement.statement_date`. Para consultas SQL directas con filtrado/indexación, añadir campo físico:
   ```python
   date = models.DateField(editable=False)
   
   def save(self, *args, **kwargs):
       if not self.date and self.bank_statement:
           self.date = self.bank_statement.statement_date
       super().save(*args, **kwargs)
   ```

3. **UUIDs en URLs**: Considerar usar `django-uuidfield` o converters personalizados en URLs para manejar UUIDs de forma limpia.

4. **PostgreSQL 15+**: Asegurar que el servidor PostgreSQL sea versión 15 o superior para compatibilidad total con `JSONField` y operaciones avanzadas.
