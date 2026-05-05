/**
 * ETECSA Finanzas - Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded ejecutado');

    // ===== TABS NAVIGATION =====
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();

            const tabName = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const activeContent = document.querySelector(`[data-tab-content="${tabName}"]`);
            if (activeContent) {
                activeContent.classList.add('active');
            }

            console.log(`Settings tab switched to: ${tabName}`);
        });
    });

    // ===== LOAD USER ACTIVITIES =====
    loadUserActivities();

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
