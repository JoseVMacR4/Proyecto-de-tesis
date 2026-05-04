/**
 * ETECSA Finanzas - Dashboard Logic
 */

function getUserId() {
    const userElem = document.getElementById('currentUserId');
    if (userElem) return userElem.value;
    if (typeof window.currentUserId !== 'undefined') return window.currentUserId;
    return null;
}

function getLocalStorageKey() {
    const userId = getUserId();
    return userId ? `localNotifications_user_${userId}` : 'localNotifications';
}

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 &&
                !sidebar.contains(e.target) &&
                !sidebarToggle.contains(e.target) &&
                sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
        });
    }

    // Handle active states on sidebar links with smooth transitions
    const navLinks = document.querySelectorAll('.nav-item-custom');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Only handle transitions for actual navigation links (not '#')
            if (href && href !== '#') {
                e.preventDefault();

                // Add fade-out animation to main content
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.style.opacity = '0';
                    mainContent.style.transform = 'translateY(10px)';
                    mainContent.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
                }

                // Navigate after animation completes
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            } else {
                // For non-navigation links, just update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }

            // On mobile, close sidebar after clicking a link
            if (window.innerWidth < 992 && sidebar) {
                sidebar.classList.remove('show');
            }
        });
    });

    console.log('Dashboard Transitions Initialized');

    // Carga inicial de notificaciones (solo una vez)
    const initNotifications = async () => {
        const list = document.getElementById('globalNotificationList');
        if (!list) return;
        
        // Limpiar todo primero
        list.innerHTML = '';
        
        // Cargar locales
        const localNotifs = JSON.parse(localStorage.getItem('localNotifications') || '[]');
        const typeMap = {
            'info': { icon: 'info', color: 'text-info' },
            'warning': { icon: 'warning', color: 'text-warning' },
            'success': { icon: 'check_circle', color: 'text-success' },
            'error': { icon: 'error', color: 'text-danger' },
            'danger': { icon: 'error', color: 'text-danger' }
        };
        
        localNotifs.forEach(notif => {
            const config = typeMap[notif.type] || typeMap['info'];
            const div = document.createElement('div');
            div.className = 'notification-item p-3 border-bottom';
            div.dataset.id = notif.id;
            div.dataset.local = 'true';
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <div class="d-flex align-items-start gap-3">
                    <span class="material-symbols-outlined ${config.color}" style="font-size: 1.25rem;">${config.icon}</span>
                    <div class="d-flex flex-column w-100">
                        <span class="small text-dark mb-1" style="line-height: 1.3;">${notif.content}</span>
                        <span class="text-muted" style="font-size: 0.7rem;">${notif.created_at}</span>
                    </div>
                </div>
            `;
            list.prepend(div);
        });
        
        // Cargar del servidor (sin duplicar)
        try {
            const response = await fetch('/api/notifications/unread/', {
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            const data = await response.json();
            
            if (data.success && data.notifications) {
                data.notifications.forEach(notif => {
                    // Verificar si ya existe (por contenido que es único)
                    const exists = Array.from(list.querySelectorAll('.notification-item')).some(
                        el => el.querySelector('.text-dark').textContent.trim() === notif.content.trim()
                    );
                    if (exists) return;
                    
                    const config = typeMap[notif.type] || typeMap['info'];
                    const div = document.createElement('div');
                    div.className = 'notification-item p-3 border-bottom';
                    div.dataset.id = notif.id;
                    div.style.cursor = 'pointer';
                    div.innerHTML = `
                        <div class="d-flex align-items-start gap-3">
                            <span class="material-symbols-outlined ${config.color}" style="font-size: 1.25rem;">${config.icon}</span>
                            <div class="d-flex flex-column w-100">
                                <span class="small text-dark mb-1" style="line-height: 1.3;">${notif.content}</span>
                                <span class="text-muted" style="font-size: 0.7rem;">${notif.created_at}</span>
                            </div>
                        </div>
                    `;
                    list.prepend(div);
                });
            }
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
        }
        
        // Actualizar contador
        const countBadge = document.getElementById('globalNotificationCount');
        const totalItems = list.querySelectorAll('.notification-item').length;
        if (countBadge) {
            countBadge.innerText = totalItems > 99 ? '99+' : totalItems;
            countBadge.style.display = totalItems > 0 ? 'block' : 'none';
        }
        
        const emptyMsg = document.getElementById('emptyNotificationsMsg');
        if (emptyMsg) {
            emptyMsg.style.display = totalItems > 0 ? 'none' : 'block';
        }
    };
    
    loadLocalNotifications();

    // Actualizar notificaciones del servidor cada 30 segundos (solo agregar nuevas)
    setInterval(async () => {
        const list = document.getElementById('globalNotificationList');
        const countBadge = document.getElementById('globalNotificationCount');
        if (!list || !countBadge) return;
        
        try {
            const response = await fetch('/api/notifications/unread/', {
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            const data = await response.json();
            
            if (data.success && data.notifications) {
                const typeMap = {
                    'info': { icon: 'info', color: 'text-info' },
                    'warning': { icon: 'warning', color: 'text-warning' },
                    'success': { icon: 'check_circle', color: 'text-success' },
                    'error': { icon: 'error', color: 'text-danger' },
                    'danger': { icon: 'error', color: 'text-danger' }
                };
                
                data.notifications.forEach(notif => {
                    const exists = Array.from(list.querySelectorAll('.notification-item')).some(
                        el => el.querySelector('.text-dark').textContent.trim() === notif.content.trim()
                    );
                    if (exists) return;
                    
                    const config = typeMap[notif.type] || typeMap['info'];
                    const timestamp = notif.timestamp || new Date(notif.created_at.split(' ').reverse().join(' ')).getTime();
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
                                <span class="text-muted" style="font-size: 0.7rem;">${notif.created_at}</span>
                            </div>
                        </div>
                    `;
                    list.prepend(div);
                });
                
                // Actualizar contador
                const totalItems = list.querySelectorAll('.notification-item').length;
                countBadge.innerText = totalItems > 99 ? '99+' : totalItems;
                countBadge.style.display = totalItems > 0 ? 'block' : 'none';
                
                const emptyMsg = document.getElementById('emptyNotificationsMsg');
                if (emptyMsg) {
                    emptyMsg.style.display = totalItems > 0 ? 'none' : 'block';
                }
                updateNotificationTimes();
            }
        } catch (error) {
            console.error("Error al actualizar notificaciones:", error);
        }
    }, 30000);

    // Toggle del dropdown de notificaciones
    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationMenu');

    console.log('Notification elements found:', notifBtn, notifMenu);

    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShown = notifMenu.style.display === 'block';
            notifMenu.style.display = isShown ? 'none' : 'block';
            notifBtn.setAttribute('aria-expanded', isShown ? 'false' : 'true');
            console.log('Notification toggled:', notifMenu.style.display);
            if (!isShown) updateNotificationTimes();
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
                notifMenu.style.display = 'none';
                notifBtn.setAttribute('aria-expanded', 'false');
            }
        });

        notifMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    } else {
        console.error('Notification elements not found!');
    }

    const clearBtn = document.getElementById('clearNotificationsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markNotificationsAsRead();
        });
    }
});

/**
 * Consulta la base de datos para obtener notificaciones persistentes.
 */
async function fetchUnreadNotifications() {
    try {
        const response = await fetch('/api/notifications/unread/', {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const data = await response.json();

        const list = document.getElementById('globalNotificationList');
        const countBadge = document.getElementById('globalNotificationCount');
        const emptyMsg = document.getElementById('emptyNotificationsMsg');

        if (!list) return;

        if (!data.success) {
            console.error("Error del servidor:", data.error);
            return;
        }

        const existingNotifs = list.querySelectorAll('.notification-item:not([data-local="true"])');
        existingNotifs.forEach(el => el.remove());

        if (data.notifications && data.notifications.length > 0) {
            if (emptyMsg) emptyMsg.style.display = 'none';

            const typeMap = {
                'info': { icon: 'info', color: 'text-info' },
                'warning': { icon: 'warning', color: 'text-warning' },
                'error': { icon: 'error', color: 'text-danger' }
            };

            data.notifications.forEach(notif => {
                const exists = list.querySelector(`.notification-item[data-id="${notif.id}"]`);
                if (exists) return;
                
                const config = typeMap[notif.type] || typeMap['info'];
                const serverTime = notif.created_at;
                const timestamp = notif.timestamp || new Date(serverTime).getTime();
                
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
                            <span class="text-muted time-ago" style="font-size: 0.7rem;">${notif.created_at}</span>
                        </div>
                    </div>
                `;
                list.prepend(div);
            });

updateNotificationCount(countBadge, list);
        } else {
            updateNotificationCount(countBadge, list);
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
            const diff = Date.now() - parseInt(timestamp);
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            let timeAgo;
            if (minutes < 1) timeAgo = 'Justo ahora';
            else if (minutes < 60) timeAgo = `Hace ${minutes} min`;
            else if (hours < 24) timeAgo = `Hace ${hours} h`;
            else if (days < 7) timeAgo = `Hace ${days} día${days > 1 ? 's' : ''}`;
            else return;
            
            if (timeAgo) timeSpan.textContent = timeAgo;
        }
    });
}

setInterval(updateNotificationTimes, 60000);

function updateNow() {
    loadLocalNotifications();
    fetchUnreadNotifications();
    setTimeout(updateNotificationTimes, 500);
}

setTimeout(updateNow, 100);

/**
 * Llama al backend para actualizar el campo read_at.
 */
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

            localStorage.removeItem(getLocalStorageKey());

            const countBadge = document.getElementById('globalNotificationCount');
            const emptyMsg = document.getElementById('emptyNotificationsMsg');

            if (countBadge) countBadge.style.display = 'none';
            if (emptyMsg) emptyMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error al limpiar notificaciones:", error);
    }
}

/**
 * Utilidad para obtener el token CSRF.
 */
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

/**
 * Agrega una notificación al dropdown visualmente (persiste en localStorage)
 */
window.addGlobalNotification = function(message, type = 'info') {
    const list = document.getElementById('globalNotificationList');
    const countBadge = document.getElementById('globalNotificationCount');
    const emptyMsg = document.getElementById('emptyNotificationsMsg');

    if (!list || !countBadge) return;

    if (emptyMsg) emptyMsg.style.display = 'none';

    const typeMap = {
        'info': { icon: 'info', color: 'text-info' },
        'warning': { icon: 'warning', color: 'text-warning' },
        'success': { icon: 'check_circle', color: 'text-success' },
        'error': { icon: 'error', color: 'text-danger' },
        'danger': { icon: 'error', color: 'text-danger' }
    };

    const config = typeMap[type] || typeMap['info'];

    const notifData = {
        id: Date.now(),
        type: type,
        content: message,
        created_at: 'Justo ahora',
        isLocal: true,
        timestamp: Date.now(),
        userId: getUserId()
    };

    let localNotifs = JSON.parse(localStorage.getItem(getLocalStorageKey()) || '[]');
    localNotifs.push(notifData);
    
    // Solo mantener las últimas 10 notificaciones locales
    if (localNotifs.length > 10) {
        localNotifs = localNotifs.slice(-10);
    }
    
    // Limpiar notificaciones mayores a 24 horas
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    localNotifs = localNotifs.filter(n => n.timestamp > oneDayAgo);
    
    localStorage.setItem(getLocalStorageKey(), JSON.stringify(localNotifs));

    renderLocalNotification(notifData, list, countBadge, config);
    
    updateNotificationCount(countBadge, list);
};

function renderLocalNotification(notif, list, countBadge, config) {
    const div = document.createElement('div');
    div.className = 'notification-item p-3 border-bottom';
    div.dataset.id = notif.id;
    div.dataset.local = 'true';
    div.dataset.timestamp = notif.timestamp || notif.id;
    div.style.cursor = 'pointer';
    div.innerHTML = `
        <div class="d-flex align-items-start gap-3">
            <span class="material-symbols-outlined ${config.color}" style="font-size: 1.25rem;">${config.icon}</span>
            <div class="d-flex flex-column w-100">
                <span class="small text-dark mb-1" style="line-height: 1.3;">${notif.content}</span>
                <span class="text-muted" style="font-size: 0.7rem;">${notif.created_at}</span>
            </div>
        </div>
    `;
    list.prepend(div);
}

function updateNotificationCount(countBadge, list) {
    const totalItems = list.querySelectorAll('.notification-item').length;
    countBadge.innerText = totalItems > 99 ? '99+' : totalItems;
    countBadge.style.display = totalItems > 0 ? 'block' : 'none';
    
    const emptyMsg = document.getElementById('emptyNotificationsMsg');
    if (emptyMsg) {
        emptyMsg.style.display = totalItems > 0 ? 'none' : 'block';
    }
}

function loadLocalNotifications() {
    const list = document.getElementById('globalNotificationList');
    const countBadge = document.getElementById('globalNotificationCount');
    if (!list || !countBadge) return;

    list.querySelectorAll('.notification-item[data-local="true"]').forEach(el => el.remove());

    const currentUserId = getUserId();
    const localNotifs = JSON.parse(localStorage.getItem(getLocalStorageKey()) || '[]');
    const typeMap = {
        'info': { icon: 'info', color: 'text-info' },
        'warning': { icon: 'warning', color: 'text-warning' },
        'success': { icon: 'check_circle', color: 'text-success' },
        'error': { icon: 'error', color: 'text-danger' },
        'danger': { icon: 'error', color: 'text-danger' }
    };

    localNotifs.forEach(notif => {
        const exists = list.querySelector(`.notification-item[data-id="${notif.id}"]`);
        if (exists) return;
        
        const config = typeMap[notif.type] || typeMap['info'];
        const div = document.createElement('div');
        div.className = 'notification-item p-3 border-bottom';
        div.dataset.id = notif.id;
        div.dataset.local = 'true';
        div.dataset.timestamp = notif.timestamp || notif.id;
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div class="d-flex align-items-start gap-3">
                <span class="material-symbols-outlined ${config.color}" style="font-size: 1.25rem;">${config.icon}</span>
                <div class="d-flex flex-column w-100">
                    <span class="small text-dark mb-1" style="line-height: 1.3;">${notif.content}</span>
                    <span class="text-muted time-ago" style="font-size: 0.7rem;">${notif.created_at}</span>
                </div>
            </div>
        `;
        list.prepend(div);
    });
    
    updateNotificationCount(countBadge, list);
}