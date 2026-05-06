/**
 * ETECSA Finanzas - Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded ejecutado');

    // ===== TABS NAVIGATION =====
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function to switch tab
    function switchTab(tabName) {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab
        const selectedTab = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Show corresponding content
        const activeContent = document.querySelector(`[data-tab-content="${tabName}"]`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        console.log(`Settings tab switched to: ${tabName}`);

        if (tabName === 'reports') {
            loadReports();
        }
    }

    // Restore tab from localStorage
    const savedTab = localStorage.getItem('settings_active_tab');
    if (savedTab && document.querySelector(`.settings-tab[data-tab="${savedTab}"]`)) {
        switchTab(savedTab);
    }

    // Add click listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            localStorage.setItem('settings_active_tab', tabName);
            switchTab(tabName);
        });
    });

    // ===== LOAD USER ACTIVITIES =====
    loadUserActivities();

    // ===== CHECK FOR NEW REPORTS =====
    if (localStorage.getItem('reportes_actualizar') === 'true') {
        localStorage.removeItem('reportes_actualizar');
        const reportsTab = document.querySelector('.settings-tab[data-tab="reports"]');
        if (reportsTab && reportsTab.classList.contains('active')) {
            loadReports();
        }
    }

    // ===== LISTEN FOR NEW REPORTS (Real-time) =====
    window.addEventListener('reporte-creado', function() {
        console.log('[DEBUG] Evento reporte-creado detectado');
        const reportsTab = document.querySelector('.settings-tab[data-tab="reports"]');
        if (reportsTab && reportsTab.classList.contains('active')) {
            loadReports();
        }
    });

    // ===== DELETE REPORT MODAL =====
    const btnConfirmDeleteReport = document.getElementById('btnConfirmDeleteReport');
    if (btnConfirmDeleteReport) {
        btnConfirmDeleteReport.addEventListener('click', function() {
            deleteReport();
        });
    }

    // ===== INITIALIZATION LOG =====
    console.log('Settings Page Initialized Successfully');
});

async function loadUserActivities() {
    console.log('[DEBUG] loadUserActivities iniciado');

    const activitiesList = document.getElementById('activities-list');
    console.log('[DEBUG] Elemento activities-list:', activitiesList);

    if (!activitiesList) {
        console.error('[DEBUG] Elemento activities-list no encontrado en el DOM');
        return;
    }

    try {
        console.log('[DEBUG] Haciendo fetch a /api/user/activities/');
        const response = await fetch('/api/user/activities/');
        console.log('[DEBUG] Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[DEBUG] Data recibida:', data);

        if (data.success && data.activities && data.activities.length > 0) {
            console.log('[DEBUG] Actividades encontradas:', data.activities.length);
            activitiesList.innerHTML = data.activities.map(activity => createActivityItem(activity)).join('');
        } else {
            console.log('[DEBUG] No hay actividades, mostrando mensaje vacio');
            activitiesList.innerHTML = `
                <div class="empty-state py-3">
                    <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--outline);">history</span>
                    <p class="text-on-surface-variant small">Sin acciones registradas</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('[DEBUG] Error cargando actividades:', error);
        activitiesList.innerHTML = `
            <div class="empty-state py-3">
                <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--outline);">error</span>
                <p class="text-on-surface-variant small">Error al cargar actividades</p>
            </div>
        `;
    }
}

function createActivityItem(activity) {
    const actionLabels = {
        'login': 'Inicio de sesión',
        'logout': 'Cierre de sesión',
        'conciliation': 'Conciliación',
        'upload_statement': 'Subir estado de cuenta',
        'create_user': 'Crear usuario',
        'update_user': 'Actualizar usuario',
        'delete_user': 'Eliminar usuario',
        'create_bank': 'Crear banco',
        'update_bank': 'Actualizar banco',
        'delete_bank': 'Eliminar banco',
        'create_operation': 'Crear operación',
        'update_operation': 'Actualizar operación',
        'delete_operation': 'Eliminar operación',
        'create_office': 'Crear oficina',
        'update_office': 'Actualizar oficina',
        'delete_office': 'Eliminar oficina',
        'generate_report': 'Generar reporte'
    };

    const actionIcons = {
        'login': 'login',
        'logout': 'logout',
        'conciliation': 'check_circle',
        'upload_statement': 'upload_file',
        'create_user': 'person_add',
        'update_user': 'person',
        'delete_user': 'person_remove',
        'create_bank': 'account_balance',
        'update_bank': 'account_balance',
        'delete_bank': 'account_balance',
        'create_operation': 'add_circle',
        'update_operation': 'edit',
        'delete_operation': 'remove_circle',
        'create_office': 'location_city',
        'update_office': 'location_city',
        'delete_office': 'location_city',
        'generate_report': 'description'
    };

    const label = actionLabels[activity.action] || activity.action;
    const icon = actionIcons[activity.action] || 'history';

    return `
        <div class="activity-item">
            <span class="material-symbols-outlined activity-icon">${icon}</span>
            <div class="activity-info">
                <p class="activity-label">${label}</p>
                <p class="activity-description">${activity.description}</p>
            </div>
            <span class="activity-date">${activity.created_at}</span>
        </div>
    `;
}

let notificationsPage = 1;
const maxPages = 5;
const itemsPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadUserNotifications(notificationsPage);
});

async function loadUserNotifications(page) {
    console.log('[DEBUG] loadUserNotifications iniciado, page:', page);

    const tableBody = document.getElementById('notificationsTableBody');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    const notificationTotal = document.getElementById('notificationTotal');

    if (!tableBody) {
        console.error('[DEBUG] Elemento notificationsTableBody no encontrado');
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                    <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--outline);">hourglass_empty</span>
                    <p class="text-on-surface-variant small mt-2">Cargando notificaciones...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`/api/user/notifications/?page=${page}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[DEBUG] Data notificaciones:', data);

        if (data.success) {
            notificationTotal.textContent = `${data.total_count} notificaciones`;
            
            if (data.notifications && data.notifications.length > 0) {
                tableBody.innerHTML = data.notifications.map(notif => createNotificationRow(notif)).join('');
                renderPagination(data, page);
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-4">
                            <div class="d-flex flex-column align-items-center">
                                <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--outline);">inbox</span>
                                <p class="text-on-surface-variant mt-2">No hay notificaciones</p>
                            </div>
                        </td>
                    </tr>
                `;
                paginationInfo.textContent = '';
                paginationControls.innerHTML = '';
            }
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('[DEBUG] Error cargando notificaciones:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--error);">error</span>
                        <p class="text-on-surface-variant small mt-2">Error al cargar notificaciones</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function createNotificationRow(notif) {
    const typeLabels = {
        'info': 'Info',
        'success': 'Éxito',
        'warning': 'Advertencia',
        'error': 'Error'
    };

    const typeIcons = {
        'info': 'info',
        'success': 'check_circle',
        'warning': 'warning',
        'error': 'error'
    };

    const label = typeLabels[notif.type] || notif.type;
    const icon = typeIcons[notif.type] || 'notifications';
    const truncatedContent = notif.content.length > 60 ? notif.content.substring(0, 60) + '...' : notif.content;
    
    const statusBadge = notif.is_read 
        ? `<span class="status-read"><span class="material-symbols-outlined" style="font-size: 0.9rem;">visibility</span>Leída</span>`
        : `<span class="status-unread"><span class="material-symbols-outlined" style="font-size: 0.9rem;">visibility_off</span>No leída</span>`;

    return `
        <tr>
            <td>
                <span class="notification-badge ${notif.type}">
                    <span class="material-symbols-outlined" style="font-size: 0.9rem;">${icon}</span>
                    ${label}
                </span>
            </td>
            <td>
                <span class="notification-content" title="${notif.content.replace(/'/g, "\\'")}">${truncatedContent}</span>
            </td>
            <td>${notif.created_at}</td>
            <td>${statusBadge}</td>
        </tr>
    `;
}

function renderPagination(data, currentPage) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, data.total_count);
    
    paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${data.total_count} notificaciones`;
    
    let paginationHtml = '';
    
    if (data.has_previous) {
        paginationHtml += `<button class="pagination-btn" data-page="${currentPage - 1}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    for (let i = 1; i <= data.total_pages; i++) {
        const isActive = i === currentPage;
        paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (data.has_next) {
        paginationHtml += `<button class="pagination-btn" data-page="${currentPage + 1}" title="Página siguiente">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página siguiente" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_right</span>
        </span>`;
    }
    
    paginationControls.innerHTML = paginationHtml;
    
    paginationControls.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            notificationsPage = page;
            loadUserNotifications(page);
        });
    });
}

// ===== REPORTS TAB =====
let reportsPage = 1;
const reportsItemsPerPage = 20;

async function loadReports(page) {
    if (page === undefined) page = reportsPage;
    reportsPage = page;
    
    console.log('[DEBUG] loadReports iniciado, page:', page);

    const tableBody = document.getElementById('reportsTableBody');
    const reportsCount = document.getElementById('reportsCount');
    const paginationInfo = document.getElementById('reportsPaginationInfo');
    const paginationControls = document.getElementById('reportsPaginationControls');

    if (!tableBody) {
        console.error('[DEBUG] Elemento reportsTableBody no encontrado');
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="${window.userCanAccessAdmin ? 7 : 6}" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                    <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--outline);">hourglass_empty</span>
                    <p class="text-on-surface-variant small mt-2">Cargando reportes...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`/api/reports/list/?page=${page}&items_per_page=${reportsItemsPerPage}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[DEBUG] Data reportes:', data);

        if (data.success) {
            reportsCount.textContent = `${data.total_count} reporte${data.total_count !== 1 ? 's' : ''}`;

            if (data.reports && data.reports.length > 0) {
                tableBody.innerHTML = data.reports.map(report => createReportRow(report)).join('');
                renderReportsPagination(data, page);
            } else {
                const colspan = window.userCanAccessAdmin ? 7 : 6;
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="${colspan}" class="text-center py-4">
                            <div class="d-flex flex-column align-items-center">
                                <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--outline);">inbox</span>
                                <p class="text-on-surface-variant mt-2">No hay reportes</p>
                            </div>
                        </td>
                    </tr>
                `;
                paginationInfo.textContent = '';
                paginationControls.innerHTML = '';
            }
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('[DEBUG] Error cargando reportes:', error);
        tableBody.innerHTML = `
            <tr>
<td colspan="${window.userCanAccessAdmin ? 7 : 6}" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <span class="material-symbols-outlined" style="font-size: 2rem; color: var(--error);">error</span>
                        <p class="text-on-surface-variant small mt-2">Error al cargar reportes</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function renderReportsPagination(data, currentPage) {
    const paginationInfo = document.getElementById('reportsPaginationInfo');
    const paginationControls = document.getElementById('reportsPaginationControls');
    
    const startItem = (currentPage - 1) * reportsItemsPerPage + 1;
    const endItem = Math.min(currentPage * reportsItemsPerPage, data.total_count);
    
    paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${data.total_count} reportes`;
    
    let paginationHtml = '';
    
    if (data.has_previous) {
        paginationHtml += `<button class="pagination-btn" data-page="${currentPage - 1}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    for (let i = 1; i <= data.total_pages; i++) {
        const isActive = i === currentPage;
        paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (data.has_next) {
        paginationHtml += `<button class="pagination-btn" data-page="${currentPage + 1}" title="Página siguiente">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página siguiente" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_right</span>
        </span>`;
    }
    
    paginationControls.innerHTML = paginationHtml;
    
    paginationControls.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            loadReports(page);
        });
    });
}

function createReportRow(report) {
    const typeLabels = {
        'error': 'Error',
        'estados_cuenta': 'Estados de Cuenta',
        'conciliacion': 'Conciliación',
        'transacciones': 'Transacciones',
        'exportacion': 'Exportación',
        'informes': 'Informes',
        'notificaciones': 'Notificaciones',
        'otro': 'Otro'
    };

    const typeIcons = {
        'error': 'bug_report',
        'estados_cuenta': 'account_balance',
        'conciliacion': 'sync_alt',
        'transacciones': 'swap_horiz',
        'exportacion': 'download',
        'informes': 'description',
        'notificaciones': 'notifications',
        'otro': 'more_horiz'
    };

    const typeLabel = typeLabels[report.type] || report.type;
    const typeIcon = typeIcons[report.type] || 'description';
    
    // Limpiar el texto de saltos de línea y espacios extra
    const cleanText = (report.description || '').replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Mostramos el botón si el texto supera un tamaño razonable para una línea
    const showReadMore = cleanText.length > 35;

    const statusBadge = report.status === 'resolved'
        ? `<span class="report-status-badge resolved"><span class="material-symbols-outlined" style="font-size: 0.9rem;">check_circle</span> Solucionado</span>`
        : `<span class="report-status-badge pending"><span class="material-symbols-outlined" style="font-size: 0.9rem;">pending</span> Pendiente</span>`;

    let actionsHtml = '';
    if (window.userCanAccessAdmin) {
        if (report.status === 'pending') {
            actionsHtml += `
                <button class="btn btn-link p-0 btn-action-solve" onclick="updateReportStatus('${report.id}', 'resolved')" title="Marcar como solucionado">
                    <span class="material-symbols-outlined">check_circle</span>
                </button>
            `;
        }
        actionsHtml += `
            <button class="btn btn-link p-0 btn-action-delete" onclick="showDeleteReportModal('${report.id}')" title="Eliminar reporte">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
    }

    return `
        <tr>
            <td>
                <span class="report-type-badge">
                    <span class="material-symbols-outlined" style="font-size: 0.9rem;">${typeIcon}</span>
                    ${typeLabel}
                </span>
            </td>
            <td><strong>${report.subject}</strong></td>
            <td>
                <span class="report-desc-text truncated" id="desc-${report.id}">${cleanText}</span>
                ${showReadMore ? `<button class="report-read-more" onclick="toggleDescription('${report.id}', this)">Ver más</button>` : ''}
            </td>
            <td>${report.reporter_full_name || report.reporter_name}</td>
            <td>${report.created_at}</td>
            <td>${statusBadge}</td>
            ${window.userCanAccessAdmin ? '<td>' + actionsHtml + '</td>' : ''}
        </tr>
    `;
}

async function updateReportStatus(reportId, newStatus) {
    try {
        const response = await fetch(`/api/reports/${reportId}/status/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadReports();
        } else {
            showToast(data.error || 'Error al actualizar el reporte', 'error');
        }
    } catch (error) {
        showToast('Error al actualizar el reporte', 'error');
        console.error('Error:', error);
    }
}

let deleteReportId = null;

function showDeleteReportModal(reportId) {
    deleteReportId = reportId;
    const modal = new bootstrap.Modal(document.getElementById('modalDeleteReport'));
    modal.show();
}

async function deleteReport() {
    if (!deleteReportId) return;
    
    const reportId = deleteReportId;
    deleteReportId = null;
    
    const modalEl = document.getElementById('modalDeleteReport');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    try {
        const response = await fetch(`/api/reports/${reportId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadReports();
        } else {
            showToast(data.error || 'Error al eliminar el reporte', 'error');
        }
    } catch (error) {
        showToast('Error al eliminar el reporte', 'error');
        console.error('Error:', error);
    }
}

function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function toggleDescription(reportId, btn) {
    const span = document.getElementById('desc-' + reportId);
    
    if (btn.textContent === 'Ver más') {
        span.classList.remove('truncated');
        span.classList.add('expanded');
        btn.textContent = 'Ver menos';
    } else {
        span.classList.remove('expanded');
        span.classList.add('truncated');
        btn.textContent = 'Ver más';
    }
}
