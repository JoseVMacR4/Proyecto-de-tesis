// Variables globales para los modales
let userModal, operationModal, operationDetailsModal, bankModal, bankDetailsModal, officeModal, officeDetailsModal, deleteModal, userDetailsModal;

/**
 * Limpia mensajes de error eliminando información técnica
 */
function cleanMessage(message) {
    if (!message) return 'Ha ocurrido un error';
    
    message = message.replace(/\\u[\da-f]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
    });
    
    const technicalPatterns = [
        /Traceback.*$/m,
        /File ".*", line \d+/,
        /"\/.*\.py":/,
        /\\\\.*\\.*\.py/,
        /python.*error/i,
        /django.*error/i,
        /database.*error/i,
        /sqlite.*error/i,
        /IntegrityError.*/,
        /OperationalError.*/,
        /ProgrammingError.*/,
        /ValueError.*/,
        /TypeError.*/,
        /KeyError.*/,
        /AttributeError.*/
    ];
    
    if (message.includes('llave duplicada') || message.includes('duplicate key') || message.includes('UNIQUE constraint')) {
        if (message.includes('email') || message.includes('Email') || message.includes('user_email')) {
            return 'El email ya existe';
        }
        if (message.includes('(code)=')) {
            return 'El código ya existe';
        }
        return 'Ya existe un registro con estos datos';
    }
    
    const hasTechnicalInfo = technicalPatterns.some(pattern => pattern.test(message));
    
    if (hasTechnicalInfo) {
        if (message.includes('UNIQUE constraint')) return 'Ya existe un registro con estos datos';
        if (message.includes('FOREIGN KEY')) return 'Error de relación con otros datos';
        if (message.includes('NOT NULL')) return 'Faltan datos requeridos';
        if (message.includes('database')) return 'Error de base de datos';
        return 'Ha ocurrido un error. Por favor contacte al administrador.';
    }
    
    if (message.includes('no coincide con la cuenta del archivo')) {
        if (message.includes('Error en')) {
            return 'Error: La cuenta seleccionada no coincide con la cuenta del archivo';
        }
        return 'La cuenta seleccionada no coincide con la cuenta del archivo';
    }
    
    if (message.includes('Ya existe un estado de cuenta')) {
        if (message.includes('Error en')) {
            return 'Error: Ya existe un estado de cuenta para esta cuenta en esa fecha';
        }
        return 'Ya existe un estado de cuenta para esta cuenta en esa fecha';
    }
    
    if (message.includes('cuenta bancaria con ID')) {
        return 'Cuenta bancaria no encontrada';
    }
    
    if (message.includes('Formato') && message.includes('no soportado')) {
        return 'Formato de archivo no soportado. Use archivos .txt';
    }
    
    if (message.includes('No se detectó fecha válida')) {
        return 'No se detectó fecha válida en el archivo';
    }
    
    if (message.includes('No se pudo verificar el número de cuenta')) {
        return 'No se pudo verificar el número de cuenta en el archivo';
    }
    
    let cleaned = message;
    
    if (!cleaned.includes('Error en')) {
        cleaned = cleaned.replace(/Archivo:\s*[\w\-]+/gi, 'Archivo: (datos)');
    }
    cleaned = cleaned.replace(/selecci[oó]n:\s*[\w\-]+/gi, 'selección: (datos)');
    cleaned = cleaned.replace(/cuenta\s+[\w\-]+\s+en\s+la\s+fecha\s+[\d\-]+/gi, 'esta cuenta en esa fecha');
    cleaned = cleaned.replace(/para\s+la\s+cuenta\s+[\w\-]+/gi, 'para esta cuenta');
    cleaned = cleaned.replace(/fecha\s+[\d\-]+/gi, 'fecha (datos)');
    cleaned = cleaned.replace(/ID\s+[\w\-]+/gi, 'ID (datos)');
    cleaned = cleaned.replace(/cuenta\s+bancaria\s+con\s+ID\s+[\w\-]+/gi, 'cuenta bancaria');
    
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tabs
    initTabs();

    // Inicializar modales Bootstrap
    initModals();

    // Inicializar botones de acción
    initActionButtons();

    // Inicializar formularios
    initForms();

    // Cargar datos iniciales
    loadUsersTable();
    loadOperationsTable();
    loadBanksList();
    loadOfficesTable();
});

/**
 * Inicializa la navegación por tabs
 */
function initTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Leer la pestaña activa desde localStorage
    const activeTab = localStorage.getItem('activeAdminTab') || 'users';
    const targetContent = document.getElementById(`tab-${activeTab}`);
    if (targetContent) {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        const activeTabElement = document.querySelector(`[data-tab="${activeTab}"]`);
        if (activeTabElement) activeTabElement.classList.add('active');
        targetContent.classList.add('active');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remover clase active de todos los tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar el tab seleccionado
            this.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Guardar en localStorage
            localStorage.setItem('activeAdminTab', targetTab);
        });
    });
}

/**
 * Inicializa los modales de Bootstrap
 */
function initModals() {
    if (typeof bootstrap !== 'undefined') {
        userModal = new bootstrap.Modal(document.getElementById('modalUser'));
        operationModal = new bootstrap.Modal(document.getElementById('modalOperation'));
        operationDetailsModal = new bootstrap.Modal(document.getElementById('modalOperationDetails'));
        bankModal = new bootstrap.Modal(document.getElementById('modalBank'));
        bankDetailsModal = new bootstrap.Modal(document.getElementById('modalBankDetails'));
        officeModal = new bootstrap.Modal(document.getElementById('modalOffice'));
        officeDetailsModal = new bootstrap.Modal(document.getElementById('modalOfficeDetails'));
        deleteModal = new bootstrap.Modal(document.getElementById('modalDelete'));
        userDetailsModal = new bootstrap.Modal(document.getElementById('modalUserDetails'));
    }
}

/**
 * Inicializa los formularios
 */
function initForms() {
    // Formulario de Usuario
    const formUser = document.getElementById('formUser');
    if (formUser) {
        formUser.addEventListener('submit', handleUserSubmit);
    }

    // Formulario de Operación
    const formOperation = document.getElementById('formOperation');
    if (formOperation) {
        formOperation.addEventListener('submit', handleOperationSubmit);
    }

    // Formulario de Cuenta Bancaria
    const formBank = document.getElementById('formBank');
    if (formBank) {
        formBank.addEventListener('submit', handleBankSubmit);
    }

    // Formulario de Oficina
    const formOffice = document.getElementById('formOffice');
    if (formOffice) {
        formOffice.addEventListener('submit', handleOfficeSubmit);
    }
}

/**
 * Maneja el envío del formulario de usuario
 */
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const action = document.getElementById('userFormAction').value;
    const url = action === 'create' 
        ? '/admin-panel/users/create/' 
        : `/admin-panel/users/${userId}/update/`;
    
    const data = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        first_name: document.getElementById('userFirstName').value,
        last_name: document.getElementById('userLastName').value,
        role_id: document.getElementById('userRole').value,
        is_active: document.getElementById('userIsActive').checked
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            userModal.hide();
            // Actualizar la tabla de usuarios sin recargar
            await loadUsersTable();
        } else {
            showAlert('danger', result.error || 'Error al guardar el usuario');
        }
    } catch (error) {
        showAlert('danger', 'Error de conexión: ' + error.message);
    }
}

/**
 * Maneja el envío del formulario de operación
 */
async function handleOperationSubmit(e) {
    e.preventDefault();
    
    const operationId = document.getElementById('operationId').value;
    const action = document.getElementById('operationFormAction').value;
    const url = action === 'create' 
        ? '/admin-panel/operations/create/' 
        : `/admin-panel/operations/${operationId}/update/`;
    
    const data = {
        code: document.getElementById('operationCode').value,
        name: document.getElementById('operationName').value
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            operationModal.hide();
            // Actualizar la tabla de operaciones sin recargar
            await loadOperationsTable();
        } else {
            showAlert('danger', result.error || 'Error al guardar la operación');
        }
    } catch (error) {
        showAlert('danger', 'Error de conexión: ' + error.message);
    }
}

/**
 * Maneja el envío del formulario de cuenta bancaria
 */
async function handleBankSubmit(e) {
    e.preventDefault();
    
    const bankId = document.getElementById('bankId').value;
    const action = document.getElementById('bankFormAction').value;
    const url = action === 'create' 
        ? '/admin-panel/bank-accounts/create/' 
        : `/admin-panel/bank-accounts/${bankId}/update/`;
    
    const data = {
        code: document.getElementById('bankCode').value,
        name: document.getElementById('bankName').value
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            bankModal.hide();
            // Actualizar la lista de cuentas bancarias sin recargar
            await loadBanksList();
        } else {
            showAlert('danger', result.error || 'Error al guardar la cuenta bancaria');
        }
    } catch (error) {
        showAlert('danger', 'Error de conexión: ' + error.message);
    }
}

/**
 * Maneja el envío del formulario de oficina
 */
async function handleOfficeSubmit(e) {
    e.preventDefault();
    
    const officeId = document.getElementById('officeId').value;
    const action = document.getElementById('officeFormAction').value;
    const url = action === 'create' 
        ? '/admin-panel/offices/create/' 
        : `/admin-panel/offices/${officeId}/update/`;
    
    const data = {
        code: document.getElementById('officeCode').value,
        name: document.getElementById('officeName').value
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            officeModal.hide();
            // Actualizar la tabla de oficinas sin recargar
            await loadOfficesTable();
        } else {
            showAlert('danger', result.error || 'Error al guardar la oficina');
        }
    } catch (error) {
        showAlert('danger', 'Error de conexión: ' + error.message);
    }
}

/**
 * Inicializa los botones de acción (editar, eliminar, agregar)
 */
function initActionButtons() {
    // Botón Agregar Usuario
    const btnAddUser = document.getElementById('btnAddUser');
    if (btnAddUser) {
        btnAddUser.addEventListener('click', function() {
            resetForm('user');
            document.getElementById('modalUserLabel').textContent = 'Nuevo Usuario';
            userModal.show();
        });
    }

    // Botón Agregar Operación
    const btnAddOperation = document.getElementById('btnAddOperation');
    if (btnAddOperation) {
        btnAddOperation.addEventListener('click', function() {
            resetForm('operation');
            document.getElementById('modalOperationLabel').textContent = 'Nueva Operación';
            operationModal.show();
        });
    }

    // Botón Agregar Cuenta Bancaria
    const btnAddBank = document.getElementById('btnAddBank');
    if (btnAddBank) {
        btnAddBank.addEventListener('click', function() {
            resetForm('bank');
            document.getElementById('modalBankLabel').textContent = 'Nueva Cuenta Bancaria';
            bankModal.show();
        });
    }

    // Botón Agregar Oficina
    const btnAddOffice = document.getElementById('btnAddOffice');
    if (btnAddOffice) {
        btnAddOffice.addEventListener('click', function() {
            resetForm('office');
            document.getElementById('modalOfficeLabel').textContent = 'Nueva Oficina';
            officeModal.show();
        });
    }
}

/**
 * Resetea un formulario específico
 */
function resetForm(type) {
    if (type === 'user') {
        document.getElementById('userId').value = '';
        document.getElementById('userFormAction').value = 'create';
        document.getElementById('userUsername').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('userPassword').placeholder = 'Establezca la contraseña';
        document.getElementById('userFirstName').value = '';
        document.getElementById('userLastName').value = '';
        document.getElementById('userRole').value = '';
        document.getElementById('userIsActive').checked = true;
        document.getElementById('userIsActive').disabled = false;
    } else if (type === 'operation') {
        document.getElementById('operationId').value = '';
        document.getElementById('operationFormAction').value = 'create';
        document.getElementById('operationCode').value = '';
        document.getElementById('operationName').value = '';
    } else if (type === 'bank') {
        document.getElementById('bankId').value = '';
        document.getElementById('bankFormAction').value = 'create';
        document.getElementById('bankCode').value = '';
        document.getElementById('bankName').value = '';
    } else if (type === 'office') {
        document.getElementById('officeId').value = '';
        document.getElementById('officeFormAction').value = 'create';
        document.getElementById('officeCode').value = '';
        document.getElementById('officeName').value = '';
    }
}

/**
 * Elimina un elemento mediante una petición DELETE/POST
 */
async function deleteItem(url, itemName) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            // Determinar qué tabla/lista actualizar según la URL
            if (url.includes('/users/')) {
                await loadUsersTable();
            } else if (url.includes('/operations/')) {
                await loadOperationsTable();
            } else if (url.includes('/bank-accounts/')) {
                await loadBanksList();
            } else if (url.includes('/offices/')) {
                await loadOfficesTable();
            }
        } else {
            showAlert('danger', result.error || `Error al eliminar el ${itemName}`);
        }
    } catch (error) {
        showAlert('danger', 'Error de conexión: ' + error.message);
    }
}

/**
 * Re-inicializa los event listeners para los botones de usuario después de cargar la tabla dinámicamente
 */
function reinitializeUserButtons() {
    // Botones de Ver Usuario
    document.querySelectorAll('.btn-view-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            viewUserDetails(userId);
        });
    });

    // Botones de Editar Usuario
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            editUser(userId);
        });
    });

    // Botones de Eliminar Usuario
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            
            document.getElementById('deleteMessage').textContent = `¿Está seguro que desea eliminar el usuario "${username}"?`;
            document.getElementById('btnConfirmDelete').onclick = function() {
                deleteItem(`/admin-panel/users/${userId}/delete/`, 'usuario');
                deleteModal.hide();
            };
            deleteModal.show();
        });
    });
}

/**
 * Muestra una alerta temporal
 */
function showAlert(type, message) {
    const cleanMsg = cleanMessage(message);
    document.querySelectorAll('.admin-alert').forEach(el => el.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `admin-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${cleanMsg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);

    // Actualizar notificaciones del servidor para la campana
    if (type !== 'info' && typeof window.reloadNotifications === 'function') {
        setTimeout(() => window.reloadNotifications(), 500);
    }
}

/**
 * Obtiene el token CSRF de las cookies
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
 * Carga la tabla de usuarios desde la API
 */
let usersPage = 1;
const usersItemsPerPage = 10;
let operationsPage = 1;
const operationsItemsPerPage = 10;
let banksPage = 1;
const banksItemsPerPage = 10;
let officesPage = 1;
const officesItemsPerPage = 10;

async function loadUsersTable(page) {
    if (page === undefined) page = usersPage;
    usersPage = page;
    
    try {
        const response = await fetch(`/admin-panel/users/list/?page=${page}&items_per_page=${usersItemsPerPage}`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tab-users tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (result.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
            } else {
                window.usersData = result.users;
                result.users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="fw-bold text-primary">${user.username}</td>
                        <td class="text-muted">${user.email}</td>
                        <td>${user.role_name}</td>
                        <td><span class="status-badge ${user.is_active ? 'status-matched' : 'status-pending'}">${user.is_active ? 'Activo' : 'Inactivo'}</span></td>
                        <td class="text-end">
                            <button class="btn btn-link p-0 text-muted btn-view-user" data-user-id="${user.id}"><span class="material-symbols-outlined">visibility</span></button>
                            <button class="btn btn-link p-0 text-muted btn-edit-user" data-user-id="${user.id}"><span class="material-symbols-outlined">edit</span></button>
                            ${user.id !== window.currentUserId ? `<button class="btn btn-link p-0 text-muted btn-delete-user" data-user-id="${user.id}"><span class="material-symbols-outlined">delete</span></button>` : ''}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                reinitializeUserButtons();
            }
            
            updateStats('users', result.stats);
            
            // Renderizar paginación
            renderUsersPagination(result.pagination);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsersPagination(pagination) {
    const paginationInfo = document.getElementById('usersPaginationInfo');
    const paginationControls = document.getElementById('usersPaginationControls');
    
    if (!paginationInfo || !paginationControls) return;
    
    const startItem = pagination.total_count === 0 ? 0 : (pagination.current_page - 1) * usersItemsPerPage + 1;
    const endItem = Math.min(pagination.current_page * usersItemsPerPage, pagination.total_count);
    
    paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${pagination.total_count} usuarios`;
    
    let paginationHtml = '';
    
    if (pagination.has_previous) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page - 1}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    for (let i = 1; i <= pagination.total_pages; i++) {
        const isActive = i === pagination.current_page;
        paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (pagination.has_next) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page + 1}" title="Página siguiente">
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
            loadUsersTable(page);
        });
    });
}

/**
 * Carga la tabla de operaciones desde la API
 */
async function loadOperationsTable(page) {
    if (page === undefined) page = operationsPage;
    operationsPage = page;
    
    try {
        const response = await fetch(`/admin-panel/operations/list/?page=${page}&items_per_page=${operationsItemsPerPage}`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tab-operations tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (result.operations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay operaciones registradas</td></tr>';
            } else {
                window.operationsData = result.operations;
                result.operations.forEach(op => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="font-monospace fw-bold text-primary">${op.code}</td>
                        <td class="fw-bold">${op.name}</td>
                        <td class="text-end">
                            <button class="btn btn-link p-0 text-muted btn-view-operation" data-operation-id="${op.id}"><span class="material-symbols-outlined">visibility</span></button>
                            <button class="btn btn-link p-0 text-muted btn-edit-operation" data-operation-id="${op.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-link p-0 text-muted btn-delete-operation" data-operation-id="${op.id}"><span class="material-symbols-outlined">delete</span></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                reinitializeOperationButtons();
            }
            
            updateStats('operations', result.stats);
            
            renderOperationsPagination(result.pagination);
        }
    } catch (error) {
        console.error('Error loading operations:', error);
    }
}

function renderOperationsPagination(pagination) {
    const paginationInfo = document.getElementById('operationsPaginationInfo');
    const paginationControls = document.getElementById('operationsPaginationControls');
    
    if (!paginationInfo || !paginationControls) return;
    
    const startItem = pagination.total_count === 0 ? 0 : (pagination.current_page - 1) * operationsItemsPerPage + 1;
    const endItem = Math.min(pagination.current_page * operationsItemsPerPage, pagination.total_count);
    
    paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${pagination.total_count} operaciones`;
    
    let paginationHtml = '';
    
    if (pagination.has_previous) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page - 1}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    for (let i = 1; i <= pagination.total_pages; i++) {
        const isActive = i === pagination.current_page;
        paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (pagination.has_next) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page + 1}" title="Página siguiente">
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
            loadOperationsTable(page);
        });
    });
}

/**
 * Carga la lista de cuentas bancarias desde la API
 */
async function loadBanksList(page) {
    if (page === undefined) page = banksPage;
    banksPage = page;
    
    try {
        const response = await fetch(`/admin-panel/bank-accounts/list/?page=${page}&items_per_page=${banksItemsPerPage}`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const bankList = document.querySelector('#tab-banks .bank-list');
            if (!bankList) return;
            
            bankList.innerHTML = '';
            
            if (result.banks.length === 0) {
                bankList.innerHTML = '<div class="text-center text-muted py-4">No hay cuentas bancarias registradas</div>';
            } else {
                window.banksData = result.banks;
                result.banks.forEach(bank => {
                    const div = document.createElement('div');
                    div.className = 'bank-item';
                    div.innerHTML = `
                        <div class="bank-item-left">
                            <div class="bank-icon-container">
                                <span class="material-symbols-outlined">account_balance</span>
                            </div>
                            <div class="bank-info">
                                <span class="bank-name">${bank.name}</span>
                                <span class="bank-code">${bank.code}</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-bank-action btn-view-bank" data-bank-id="${bank.id}"><span class="material-symbols-outlined">visibility</span></button>
                            <button class="btn btn-bank-action btn-edit-bank" data-bank-id="${bank.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-bank-action btn-delete-bank" data-bank-id="${bank.id}"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    `;
                    bankList.appendChild(div);
                });
                
                reinitializeBankButtons();
            }
            
            updateStats('banks', result.stats);
            
            renderBanksPagination(result.pagination);
        }
    } catch (error) {
        console.error('Error loading banks:', error);
    }
}

function renderBanksPagination(pagination) {
    const paginationInfo = document.getElementById('banksPaginationInfo');
    const paginationControls = document.getElementById('banksPaginationControls');
    
    if (!paginationInfo || !paginationControls) return;
    
    const startItem = pagination.total_count === 0 ? 0 : (pagination.current_page - 1) * banksItemsPerPage + 1;
    const endItem = Math.min(pagination.current_page * banksItemsPerPage, pagination.total_count);
    
    paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${pagination.total_count} cuentas`;
    
    let paginationHtml = '';
    
    if (pagination.has_previous) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page - 1}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    for (let i = 1; i <= pagination.total_pages; i++) {
        const isActive = i === pagination.current_page;
        paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (pagination.has_next) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page + 1}" title="Página siguiente">
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
            loadBanksList(page);
        });
    });
}

/**
 * Carga la tabla de oficinas desde la API
 */
async function loadOfficesTable(page) {
    if (page === undefined) page = officesPage;
    officesPage = page;
    
    try {
        const response = await fetch(`/admin-panel/offices/list/?page=${page}&items_per_page=${officesItemsPerPage}`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tab-offices tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (result.offices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay oficinas registradas</td></tr>';
            } else {
                window.officesData = result.offices;
                result.offices.forEach(office => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="font-monospace fw-bold text-primary">${office.code}</td>
                        <td class="fw-bold">${office.name}</td>
                        <td class="text-end">
                            <button class="btn btn-link p-0 text-muted btn-view-office" data-office-id="${office.id}"><span class="material-symbols-outlined">visibility</span></button>
                            <button class="btn btn-link p-0 text-muted btn-edit-office" data-office-id="${office.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-link p-0 text-muted btn-delete-office" data-office-id="${office.id}"><span class="material-symbols-outlined">delete</span></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                reinitializeOfficeButtons();
            }
            
            updateStats('offices', result.stats);
            
            renderOfficesPagination(result.pagination);
        }
    } catch (error) {
        console.error('Error loading offices:', error);
    }
}

function renderOfficesPagination(pagination) {
    const paginationInfo = document.getElementById('officesPaginationInfo');
    const paginationControls = document.getElementById('officesPaginationControls');
    
    if (!paginationInfo || !paginationControls) return;
    
    const startItem = pagination.total_count === 0 ? 0 : (pagination.current_page - 1) * officesItemsPerPage + 1;
    const endItem = Math.min(pagination.current_page * officesItemsPerPage, pagination.total_count);
    
    paginationInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${pagination.total_count} oficinas`;
    
    let paginationHtml = '';
    
    if (pagination.has_previous) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page - 1}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        paginationHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    for (let i = 1; i <= pagination.total_pages; i++) {
        const isActive = i === pagination.current_page;
        paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (pagination.has_next) {
        paginationHtml += `<button class="pagination-btn" data-page="${pagination.current_page + 1}" title="Página siguiente">
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
            loadOfficesTable(page);
        });
    });
}

/**
 * Actualiza las estadísticas de una sección
 */
function updateStats(section, stats) {
    if (section === 'users' && stats) {
        const totalEl = document.querySelector('#tab-users .profile-info-value:first-of-type');
        const activeEl = document.querySelector('#tab-users .profile-info-value.text-success');
        const inactiveEl = document.querySelector('#tab-users .profile-info-value.text-danger');
        const adminEl = document.querySelector('#tab-users .profile-info-value.text-primary');
        
        if (totalEl) totalEl.textContent = stats.total_users;
        if (activeEl) activeEl.textContent = stats.active_users;
        if (inactiveEl) inactiveEl.textContent = stats.inactive_users;
        if (adminEl) adminEl.textContent = stats.admin_count;
    } else if (section === 'operations' && stats) {
        const totalEl = document.querySelector('#tab-operations .profile-info-value:first-of-type');
        const activeEl = document.querySelector('#tab-operations .profile-info-value.text-success');
        
        if (totalEl) totalEl.textContent = stats.total_operations;
        if (activeEl) activeEl.textContent = stats.active_operations;
    } else if (section === 'banks' && stats) {
        const totalEl = document.querySelector('#tab-banks .profile-info-value:first-of-type');
        const activeEl = document.querySelector('#tab-banks .profile-info-value.text-success');
        const banksEl = document.querySelector('#tab-banks .profile-info-value.text-primary');
        
        if (totalEl) totalEl.textContent = stats.total_bank_accounts;
        if (activeEl) activeEl.textContent = stats.total_bank_accounts;
        if (banksEl) banksEl.textContent = stats.total_bank_accounts;
    } else if (section === 'offices' && stats) {
        const totalEl = document.querySelector('#tab-offices .profile-info-value:first-of-type');
        const activeEl = document.querySelector('#tab-offices .profile-info-value.text-success');
        
        if (totalEl) totalEl.textContent = stats.total_offices;
        if (activeEl) activeEl.textContent = stats.active_offices;
    }
}

/**
 * Re-inicializa los botones de editar/eliminar operación después de actualizar la tabla
 */
function reinitializeOperationButtons() {
    document.querySelectorAll('.btn-view-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            viewOperationDetails(operationId);
        });
    });

    document.querySelectorAll('.btn-edit-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            const row = this.closest('tr');
            const code = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('td:nth-child(2)').textContent;
            
            document.getElementById('operationId').value = operationId;
            document.getElementById('operationFormAction').value = 'edit';
            document.getElementById('operationCode').value = code;
            document.getElementById('operationName').value = name;
            
            document.getElementById('modalOperationLabel').textContent = 'Editar Operación';
            operationModal.show();
        });
    });

    document.querySelectorAll('.btn-delete-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            const row = this.closest('tr');
            const operationName = row.querySelector('td:nth-child(2)').textContent;
            
            document.getElementById('deleteMessage').textContent = `¿Está seguro que desea eliminar la operación "${operationName}"?`;
            document.getElementById('btnConfirmDelete').onclick = function() {
                deleteItem(`/admin-panel/operations/${operationId}/delete/`, 'operación');
                deleteModal.hide();
            };
            deleteModal.show();
        });
    });
}

/**
 * Re-inicializa los botones de editar/eliminar banco después de actualizar la lista
 */
function reinitializeBankButtons() {
    document.querySelectorAll('.btn-view-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            viewBankDetails(bankId);
        });
    });

    document.querySelectorAll('.btn-edit-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            const bankItem = this.closest('.bank-item');
            const name = bankItem.querySelector('.bank-name').textContent;
            const code = bankItem.querySelector('.bank-code').textContent;
            
            document.getElementById('bankId').value = bankId;
            document.getElementById('bankFormAction').value = 'edit';
            document.getElementById('bankCode').value = code;
            document.getElementById('bankName').value = name;
            
            document.getElementById('modalBankLabel').textContent = 'Editar Cuenta Bancaria';
            bankModal.show();
        });
    });

    document.querySelectorAll('.btn-delete-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            
            document.getElementById('deleteMessage').textContent = `¿Está seguro que desea eliminar la cuenta bancaria "${bankName}"?`;
            document.getElementById('btnConfirmDelete').onclick = function() {
                deleteItem(`/admin-panel/bank-accounts/${bankId}/delete/`, 'cuenta bancaria');
                deleteModal.hide();
            };
            deleteModal.show();
        });
    });
}

/**
 * Re-inicializa los botones de editar/eliminar oficina después de actualizar la tabla
 */
function reinitializeOfficeButtons() {
    document.querySelectorAll('.btn-view-office').forEach(btn => {
        btn.addEventListener('click', function() {
            const officeId = this.getAttribute('data-office-id');
            viewOfficeDetails(officeId);
        });
    });

    document.querySelectorAll('.btn-edit-office').forEach(btn => {
        btn.addEventListener('click', function() {
            const officeId = this.getAttribute('data-office-id');
            const row = this.closest('tr');
            const code = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('td:nth-child(2)').textContent;
            
            document.getElementById('officeId').value = officeId;
            document.getElementById('officeFormAction').value = 'edit';
            document.getElementById('officeCode').value = code;
            document.getElementById('officeName').value = name;
            
            document.getElementById('modalOfficeLabel').textContent = 'Editar Oficina';
            officeModal.show();
        });
    });

    document.querySelectorAll('.btn-delete-office').forEach(btn => {
        btn.addEventListener('click', function() {
            const officeId = this.getAttribute('data-office-id');
            const row = this.closest('tr');
            const officeName = row.querySelector('td:nth-child(2)').textContent;
            
            document.getElementById('deleteMessage').textContent = `¿Está seguro que desea eliminar la oficina "${officeName}"?`;
            document.getElementById('btnConfirmDelete').onclick = function() {
                deleteItem(`/admin-panel/offices/${officeId}/delete/`, 'oficina');
                deleteModal.hide();
            };
            deleteModal.show();
        });
    });
}

/**
 * Muestra los detalles de un usuario en el modal de solo lectura
 */
async function viewUserDetails(userId) {
    try {
        // Buscar el usuario en los datos cargados
        const user = window.usersData.find(u => u.id === userId);
        if (!user) {
            console.error('Usuario no encontrado');
            return;
        }
        
        document.getElementById('detailUsername').value = user.username;
        document.getElementById('detailEmail').value = user.email !== '—' ? user.email : '';
        document.getElementById('detailRole').value = user.role_name || 'Sin rol';
        document.getElementById('detailFirstName').value = user.first_name || '';
        document.getElementById('detailLastName').value = user.last_name || '';
        document.getElementById('detailIsActive').value = user.is_active ? 'Activo' : 'Inactivo';
        document.getElementById('detailCreatedAt').value = user.created_at || '—';
        document.getElementById('detailUpdatedAt').value = user.updated_at || '—';
        
        userDetailsModal.show();
    } catch (error) {
        console.error('Error viewing user details:', error);
    }
}

function viewOperationDetails(operationId) {
    try {
        const operation = window.operationsData.find(op => op.id === operationId);
        if (!operation) {
            console.error('Operación no encontrada');
            return;
        }

        document.getElementById('detailOperationCode').value = operation.code;
        document.getElementById('detailOperationName').value = operation.name;
        document.getElementById('detailOperationCreatedAt').value = operation.created_at || '—';
        document.getElementById('detailOperationUpdatedAt').value = operation.updated_at || '—';

        operationDetailsModal.show();
    } catch (error) {
        console.error('Error viewing operation details:', error);
    }
}

function viewBankDetails(bankId) {
    try {
        const bank = window.banksData.find(b => b.id === bankId);
        if (!bank) {
            console.error('Cuenta bancaria no encontrada');
            return;
        }

        document.getElementById('detailBankCode').value = bank.code;
        document.getElementById('detailBankName').value = bank.name;
        document.getElementById('detailBankCreatedAt').value = bank.created_at || '—';
        document.getElementById('detailBankUpdatedAt').value = bank.updated_at || '—';

        bankDetailsModal.show();
    } catch (error) {
        console.error('Error viewing bank details:', error);
    }
}

function viewOfficeDetails(officeId) {
    try {
        const office = window.officesData.find(o => o.id === officeId);
        if (!office) {
            console.error('Oficina no encontrada');
            return;
        }

        document.getElementById('detailOfficeCode').value = office.code;
        document.getElementById('detailOfficeName').value = office.name;
        document.getElementById('detailOfficeCreatedAt').value = office.created_at || '—';
        document.getElementById('detailOfficeUpdatedAt').value = office.updated_at || '—';

        officeDetailsModal.show();
    } catch (error) {
        console.error('Error viewing office details:', error);
    }
}

/**
 * Edita un usuario (abre el modal con datos precargados)
 */
function editUser(userId) {
    const user = window.usersData.find(u => u.id === userId);
    if (!user) {
        console.error('Usuario no encontrado');
        return;
    }
    
    document.getElementById('userId').value = user.id;
    document.getElementById('userFormAction').value = 'edit';
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userEmail').value = user.email !== '—' ? user.email : '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;
    document.getElementById('userPassword').placeholder = 'Dejar en blanco para mantener la actual';
    document.getElementById('userFirstName').value = user.first_name || '';
    document.getElementById('userLastName').value = user.last_name || '';
    document.getElementById('userRole').value = user.role_id || '';
    document.getElementById('userIsActive').checked = user.is_active;
    document.getElementById('userIsActive').disabled = String(user.id) === String(window.currentUserId);
    
    document.getElementById('modalUserLabel').textContent = 'Editar Usuario';
    userModal.show();
}
