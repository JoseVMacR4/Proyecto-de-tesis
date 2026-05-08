# Requerimientos de Despliegue - projectETECSA

## 1. Información General del Sistema

| Campo | Descripción |
|-------|-------------|
| **Nombre** | projectETECSA |
| **Tipo** | Aplicación web Django |
| **Versión Django** | 6.0.4 |
| **Propósito** | Sistema de gestión de usuarios, cuentas bancarias, conciliación de estados de cuenta y generación de reportes |
| **Tecnología** | Django + PostgreSQL + Bootstrap 5 |

---

## 2. Requisitos de Infraestructura

### 2.1 Servidor

| Componente | Requerimiento Mínimo | Recomendado |
|------------|---------------------|-------------|
| **Sistema Operativo** | Windows Server 2019+ / Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| **Python** | 3.12+ | 3.13 |
| **RAM** | 4 GB | 8 GB |
| **CPU** | 2 cores | 4 cores |
| **Espacio en Disco** | 20 GB | 50 GB+ |

### 2.2 Base de Datos

| Componente | Requerimiento |
|------------|---------------|
| **Motor** | PostgreSQL |
| **Versión mínima** | 14.0 |
| **Usuario** | postgres (o usuario dedicado) |
| **Base de datos** | etecsa_db |
| **Zona horaria** | America/Havana |

### 2.3 Software Adicional

- **WSGI Server**: Gunicorn
- **Servidor Web**: Nginx (recomendado para producción)
- **Gestor de Procesos**: systemd (Linux) o Windows Service

---

## 3. Dependencias del Proyecto

### 3.1 Paquetes Python Requerizados

```
django==6.0.4
psycopg2-binary>=2.9.9
bootstrap5>=3.0.0
```

### 3.2 Instalación de Dependencias

```bash
# Crear entorno virtual
python -m venv env
env\Scripts\activate  # Windows
# source env/bin/activate  # Linux

# Instalar dependencias
pip install django==6.0.4 psycopg2-binary bootstrap5
```

---

## 4. Configuración Crítica

### 4.1 Variables de Entorno Recomendadas

Crear archivo `.env` en la raíz del proyecto:

```env
# Django
DJANGO_SECRET_KEY=generar-secret-key-unica
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=dominio.com,www.dominio.com

# Base de Datos
DB_NAME=etecsa_db
DB_USER=postgres
DB_PASSWORD=password-seguro
DB_HOST=localhost
DB_PORT=5432
```

### 4.2 Configuración de settings.py

Los siguientes valores deben configurarse **antes del despliegue**:

| Setting | Valor Produccón |
|---------|-----------------|
| `DEBUG` | `False` |
| `SECRET_KEY` | Generar nueva key única |
| `ALLOWED_HOSTS` | Nombres de dominio del servidor |
| `DATABASES` | Credenciales de producción |
| `STATIC_ROOT` | Ruta absoluta para archivos estáticos |
| `MEDIA_ROOT` | Ruta absoluta para uploads |

### 4.3 Generar Nueva SECRET_KEY

```python
# Ejemplo en Python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

---

## 5. Pasos de Despliegue

### 5.1 Preparación del Entorno

1. **Clonar o copiar el proyecto** al servidor
2. **Crear entorno virtual** e instalar dependencias
3. **Crear la base de datos**:

   ```sql
   CREATE DATABASE etecsa_db;
   ```

4. **Configurar variables de entorno** o editar `settings.py`

### 5.2 Migraciones y Datos Iniciales

```bash
# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional)
python manage.py createsuperuser

# Recolectar archivos estáticos
python manage.py collectstatic
```

### 5.3 Configuración del Servidor

#### Opción A: Gunicorn (Linux)

```bash
# Instalar gunicorn
pip install gunicorn

# Ejecutar
gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

Crear servicio systemd (`/etc/systemd/system/etecsa.service`):

```ini
[Unit]
Description=projectETECSA
After=network.target

[Service]
Type=exec
User=www-data
WorkingDirectory=/path/to/projectETECSA
Command=/path/to/env/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable etecsa
sudo systemctl start etecsa
```

#### Opción B: Windows (IIS o similar)

Usar `python manage.py runserver 0.0.0.0:8000` como servicio Windows o configurar con IIS.

### 5.4 Nginx como Reverse Proxy (Linux)

Crear config `/etc/nginx/sites-available/etecsa`:

```nginx
server {
    listen 80;
    server_name dominio.com;

    location /static/ {
        alias /path/to/projectETECSA/staticfiles/;
    }

    location /statements/ {
        alias /path/to/projectETECSA/statements/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/etecsa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Mantenimiento

### 6.1 Respaldo de Base de Datos

Configurar respaldo automático (diario recomendado):

```bash
# Script de respaldo (agregar a crontab)
pg_dump -U postgres etecsa_db > /backups/etecsa_$(date +\%Y\%m\%d).sql
```

### 6.2 Respaldo de Archivos

Respaldar regularmente:
- Directorio `static/` (archivos CSS, JS, imágenes)
- Directorio `statements/` (estados de cuenta subidos)
- Archivo `.env` o configuración de secrets

### 6.3 Logs

- **Django**: Configurar logging en `settings.py`
- **Gunicorn**: Logs en `/var/log/gunicorn/`
- **Nginx**: Logs en `/var/log/nginx/`

### 6.4 Actualizaciones

Para actualizar el sistema en producción:

```bash
# 1. Respaldo completo
# 2. Activar entorno virtual
source env/bin/activate

# 3. Actualizar código
git pull  # o copiar nuevos archivos

# 4. Instalar nuevas dependencias si las hay
pip install -r requirements.txt

# 5. Aplicar migraciones
python manage.py migrate

# 6. Recolectar estáticos
python manage.py collectstatic

# 7. Reiniciar servicio
sudo systemctl restart etecsa
```

---

## 7. Estructura de Directorios

```
projectETECSA/
├── projectETECSA/
│   ├── core/
│   ├── apps/
│   ├── static/
│   ├── templates/
│   └── manage.py
├── staticfiles/        # collectstatic
├── statements/       # archivos subidos
├── env/               # entorno virtual
├── backups/           # respaldos de DB
└── logs/              # logs aplicación
```

---

## 8. Contacto y Soporte

Para issues o preguntas sobre el despliegue, contactar al equipo de desarrollo.

---

*Documento actualizado para projectETECSA*