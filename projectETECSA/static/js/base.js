/**
 * ETECSA Finanzas - Dashboard Logic
 * Sistema de notificaciones del servidor
 */

function getUserId() {
    const userElem = document.getElementById('currentUserId');
    if (userElem) return userElem.value;
    if (typeof window.currentUserId !== 'undefined') return window.currentUserId;
    return null;
}

const typeMap = {
    'info': { icon: 'info', color: 'text-info' },
    'warning': { icon: 'warning', color: 'text-warning' },
    'success': { icon: 'check_circle', color: 'text-success' },
    'error': { icon: 'error', color: 'text-danger' },
    'danger': { icon: 'error', color: 'text-danger' }
};

function getTimeAgo(timestamp) {
    if (!timestamp) return null;
    
    const diff = Date.now() - parseInt(timestamp);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Justo ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `Hace ${hours} h`;
    
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    
    return null;
}

function createNotificationElement(notif) {
    const config = typeMap[notif.type] || typeMap['info'];
    const timestamp = notif.timestamp || new Date(notif.created_at).getTime();
    const timeDisplay = getTimeAgo(timestamp) || notif.created_at;
    
    const div = document.createElement('div');
    div.className = 'notification-item p-3 border-bottom';
    div.dataset.id = notif.id;
    div.dataset.timestamp = timestamp;
    div.style.cursor = 'pointer';
    div.innerHTML = `
        <div class="d-flex align-items-start gap-3">
            <span class="material-symbols-outlined ${config.color}" style="font-size: 1.25rem;">${config.icon}</span>
            <div class="d-flex flex-column w-100">
                <span class="small text-dark mb-1" style="line-height: 1.3;">${notif.content}</span>
                <span class="text-muted time-ago" style="font-size: 0.7rem;">${timeDisplay}</span>
            </div>
        </div>
    `;
    return div;
}

async function loadAllNotifications() {
    const list = document.getElementById('globalNotificationList');
    const countBadge = document.getElementById('globalNotificationCount');
    if (!list || !countBadge) return;

    try {
        const response = await fetch('/api/notifications/unread/', {
            cache: 'no-cache',
            headers: { 
                'Cache-Control': 'no-cache', 
                'Pragma': 'no-cache' 
            }
        });
        
        if (!response.ok) {
            console.warn("No se pudieron cargar notificaciones:", response.status);
            return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.notifications) {
            return;
        }
        
        // Limpiar lista actual
        list.querySelectorAll('.notification-item').forEach(el => el.remove());
        
        // Ordenar por timestamp (más recientes primero)
        const notifications = [...data.notifications].sort((a, b) => b.timestamp - a.timestamp);
        
        // Renderizar
        notifications.forEach(notif => {
            const el = createNotificationElement(notif);
            list.appendChild(el);
        });
        
        // Actualizar contador
        const total = notifications.length;
        countBadge.innerText = total > 99 ? '99+' : total;
        countBadge.style.display = total > 0 ? 'flex' : 'none';
        
        // Mostrar/ocultar mensaje vacío
        const emptyMsg = document.getElementById('emptyNotificationsMsg');
        if (emptyMsg) {
            emptyMsg.style.display = total > 0 ? 'none' : 'block';
        }
        
    } catch (error) {
        console.error("Error al cargar notificaciones:", error);
    }
}

function updateNotificationTimes() {
    const items = document.querySelectorAll('#globalNotificationList .notification-item');
    items.forEach(item => {
        const timestamp = item.dataset.timestamp;
        const timeSpan = item.querySelector('.text-muted');
        if (timestamp && timeSpan) {
            const timeAgo = getTimeAgo(timestamp);
            if (timeAgo) {
                timeSpan.textContent = timeAgo;
            }
        }
    });
}

async function markNotificationsAsRead() {
    try {
        const response = await fetch('/api/notifications/mark-read/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            const list = document.getElementById('globalNotificationList');
            list.querySelectorAll('.notification-item').forEach(el => el.remove());

            const countBadge = document.getElementById('globalNotificationCount');
            const emptyMsg = document.getElementById('emptyNotificationsMsg');

            if (countBadge) countBadge.style.display = 'none';
            if (emptyMsg) emptyMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error al limpiar notificaciones:", error);
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Notifications Initialized');

    // Cargar notificaciones al inicio
    loadAllNotifications();

    // Actualizar lista cada 30 segundos
    setInterval(loadAllNotifications, 30000);

    // Actualizar tiempos cada 60 segundos
    setInterval(updateNotificationTimes, 60000);

    // Toggle del dropdown de notificaciones
    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationMenu');

    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShown = notifMenu.style.display === 'block';
            notifMenu.style.display = isShown ? 'none' : 'block';
            notifBtn.setAttribute('aria-expanded', isShown ? 'false' : 'true');
            if (!isShown) {
                loadAllNotifications();
                updateNotificationTimes();
            }

            // Cerrar dropdown de usuario si está abierto
            if (!isShown && userMenu) {
                userMenu.style.display = 'none';
                userMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
                notifMenu.style.display = 'none';
                notifBtn.setAttribute('aria-expanded', 'false');
            }
            // También cerrar dropdown de usuario
            if (userMenu && userMenuBtn && userMenu.style.display === 'block') {
                if (!userMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.style.display = 'none';
                    userMenuBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        notifMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Botón limpiar notificaciones
    const clearBtn = document.getElementById('clearNotificationsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markNotificationsAsRead();
        });
    }

    // Toggle del dropdown de usuario (similar a notificaciones)
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');

    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShown = userMenu.style.display === 'block';
            userMenu.style.display = isShown ? 'none' : 'block';
            userMenuBtn.setAttribute('aria-expanded', isShown ? 'false' : 'true');

            // Cerrar dropdown de notificaciones si está abierto
            if (!isShown && notifMenu) {
                notifMenu.style.display = 'none';
                notifBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.style.display = 'none';
                userMenuBtn.setAttribute('aria-expanded', 'false');
            }
            // También cerrar dropdown de notificaciones
            if (notifMenu && notifBtn && notifMenu.style.display === 'block') {
                if (!notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
                    notifMenu.style.display = 'none';
                    notifBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});

// Función global para recargar notificaciones (llamada desde otras páginas)
window.reloadNotifications = loadAllNotifications;