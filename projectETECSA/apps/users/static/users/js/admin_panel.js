/**
 * ETECSA Finanzas - Admin Panel JavaScript
 * Gestión de usuarios, operaciones, cuentas bancarias y oficinas
 */

// Variables globales para los modales
let userModal, operationModal, bankModal, officeModal;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tabs
    initTabs();

    // Inicializar modales Bootstrap
    initModals();

    // Inicializar botones de acción
    initActionButtons();

    // Inicializar formularios
    initForms();
});

/**
 * Inicializa la navegación por tabs
 */
function initTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');

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
        bankModal = new bootstrap.Modal(document.getElementById('modalBank'));
        officeModal = new bootstrap.Modal(document.getElementById('modalOffice'));
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
        name: document.getElementById('operationName').value,
        description: document.getElementById('operationDescription').value
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

    // Botones de Editar Usuario
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            const email = row.querySelector('td:nth-child(2)').textContent;
            const role = row.querySelector('td:nth-child(3)').textContent.trim();
            const isActive = row.querySelector('.status-badge').classList.contains('status-matched');
            
            document.getElementById('userId').value = userId;
            document.getElementById('userFormAction').value = 'edit';
            document.getElementById('userUsername').value = username;
            document.getElementById('userEmail').value = email !== '—' ? email : '';
            document.getElementById('userPassword').value = '';
            document.getElementById('userIsActive').checked = isActive;
            
            // Seleccionar el rol correspondiente
            const roleSelect = document.getElementById('userRole');
            for (let option of roleSelect.options) {
                if (option.text === role) {
                    option.selected = true;
                    break;
                }
            }
            
            document.getElementById('modalUserLabel').textContent = 'Editar Usuario';
            userModal.show();
        });
    });

    // Botones de Eliminar Usuario
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar el usuario "${username}"?`)) {
                deleteItem(`/admin-panel/users/${userId}/delete/`, 'usuario');
            }
        });
    });

    // Botones de Editar Operación
    document.querySelectorAll('.btn-edit-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            const row = this.closest('tr');
            const code = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('td:nth-child(2)').textContent;
            const description = row.querySelector('td:nth-child(3)').textContent;
            
            document.getElementById('operationId').value = operationId;
            document.getElementById('operationFormAction').value = 'edit';
            document.getElementById('operationCode').value = code;
            document.getElementById('operationName').value = name;
            document.getElementById('operationDescription').value = description !== '—' ? description : '';
            
            document.getElementById('modalOperationLabel').textContent = 'Editar Operación';
            operationModal.show();
        });
    });

    // Botones de Eliminar Operación
    document.querySelectorAll('.btn-delete-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            const row = this.closest('tr');
            const operationName = row.querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar la operación "${operationName}"?`)) {
                deleteItem(`/admin-panel/operations/${operationId}/delete/`, 'operación');
            }
        });
    });

    // Botones de Editar Banco
    document.querySelectorAll('.btn-edit-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            const bankItem = this.closest('.bank-item');
            const name = bankItem.querySelector('.bank-name').textContent;
            const code = bankItem.querySelector('.bank-description').textContent;
            
            document.getElementById('bankId').value = bankId;
            document.getElementById('bankFormAction').value = 'edit';
            document.getElementById('bankCode').value = code;
            document.getElementById('bankName').value = name;
            
            document.getElementById('modalBankLabel').textContent = 'Editar Cuenta Bancaria';
            bankModal.show();
        });
    });

    // Botones de Eliminar Banco
    document.querySelectorAll('.btn-delete-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar la cuenta bancaria "${bankName}"?`)) {
                deleteItem(`/admin-panel/bank-accounts/${bankId}/delete/`, 'cuenta bancaria');
            }
        });
    });

    // Botones de Editar Oficina
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

    // Botones de Eliminar Oficina
    document.querySelectorAll('.btn-delete-office').forEach(btn => {
        btn.addEventListener('click', function() {
            const officeId = this.getAttribute('data-office-id');
            const row = this.closest('tr');
            const officeName = row.querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar la oficina "${officeName}"?`)) {
                deleteItem(`/admin-panel/offices/${officeId}/delete/`, 'oficina');
            }
        });
    });
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
        document.getElementById('userFirstName').value = '';
        document.getElementById('userLastName').value = '';
        document.getElementById('userRole').value = '';
        document.getElementById('userIsActive').checked = true;
    } else if (type === 'operation') {
        document.getElementById('operationId').value = '';
        document.getElementById('operationFormAction').value = 'create';
        document.getElementById('operationCode').value = '';
        document.getElementById('operationName').value = '';
        document.getElementById('operationDescription').value = '';
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
 * Muestra una alerta temporal
 */
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
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
async function loadUsersTable() {
    try {
        const response = await fetch('/admin-panel/users/list/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tab-users tbody');
            if (!tbody) return;
            
            // Limpiar tabla actual
            tbody.innerHTML = '';
            
            if (result.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
            } else {
                result.users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="fw-bold text-primary">${user.username}</td>
                        <td class="text-muted">${user.email}</td>
                        <td><span class="badge rounded-pill fw-bold" style="background-color: var(--primary-container); color: var(--on-primary-container); font-size: 0.65rem;">${user.main_role}</span></td>
                        <td><span class="status-badge ${user.is_active ? 'status-matched' : 'status-pending'}">${user.is_active ? 'Activo' : 'Inactivo'}</span></td>
                        <td class="text-end">
                            <button class="btn btn-link p-0 text-muted btn-edit-user" data-user-id="${user.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-link p-0 text-muted btn-delete-user" data-user-id="${user.id}"><span class="material-symbols-outlined">delete</span></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                // Re-inicializar los event listeners para los nuevos botones
                reinitializeUserButtons();
            }
            
            // Actualizar estadísticas
            updateStats('users', result.stats);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

/**
 * Carga la tabla de operaciones desde la API
 */
async function loadOperationsTable() {
    try {
        const response = await fetch('/admin-panel/operations/list/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tab-operations tbody');
            if (!tbody) return;
            
            // Limpiar tabla actual
            tbody.innerHTML = '';
            
            if (result.operations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay operaciones registradas</td></tr>';
            } else {
                result.operations.forEach(op => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="font-monospace fw-bold text-primary">${op.code}</td>
                        <td class="fw-bold">${op.name}</td>
                        <td class="text-muted small">${op.description}</td>
                        <td><span class="status-badge status-matched">Activo</span></td>
                        <td class="text-end">
                            <button class="btn btn-link p-0 text-muted btn-edit-operation" data-operation-id="${op.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-link p-0 text-muted btn-delete-operation" data-operation-id="${op.id}"><span class="material-symbols-outlined">delete</span></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                // Re-inicializar los event listeners para los nuevos botones
                reinitializeOperationButtons();
            }
            
            // Actualizar estadísticas
            updateStats('operations', result.stats);
        }
    } catch (error) {
        console.error('Error loading operations:', error);
    }
}

/**
 * Carga la lista de cuentas bancarias desde la API
 */
async function loadBanksList() {
    try {
        const response = await fetch('/admin-panel/bank-accounts/list/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const bankList = document.querySelector('#tab-banks .bank-list');
            if (!bankList) return;
            
            // Limpiar lista actual
            bankList.innerHTML = '';
            
            if (result.banks.length === 0) {
                bankList.innerHTML = '<div class="text-center text-muted py-4">No hay cuentas bancarias registradas</div>';
            } else {
                result.banks.forEach(bank => {
                    const div = document.createElement('div');
                    div.className = 'bank-item';
                    div.innerHTML = `
                        <div class="bank-item-left">
                            <div class="bank-icon-container">
                                <span class="material-symbols-outlined">account_balance</span>
                            </div>
                            <div>
                                <div class="bank-name">${bank.name}</div>
                                <div class="bank-description">${bank.code}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="bank-status active">Activa</span>
                            <button class="btn btn-bank-action btn-edit-bank" data-bank-id="${bank.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-bank-action btn-delete-bank" data-bank-id="${bank.id}"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    `;
                    bankList.appendChild(div);
                });
                
                // Re-inicializar los event listeners para los nuevos botones
                reinitializeBankButtons();
            }
            
            // Actualizar estadísticas
            updateStats('banks', result.stats);
        }
    } catch (error) {
        console.error('Error loading banks:', error);
    }
}

/**
 * Carga la tabla de oficinas desde la API
 */
async function loadOfficesTable() {
    try {
        const response = await fetch('/admin-panel/offices/list/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tab-offices tbody');
            if (!tbody) return;
            
            // Limpiar tabla actual
            tbody.innerHTML = '';
            
            if (result.offices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay oficinas registradas</td></tr>';
            } else {
                result.offices.forEach(office => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="font-monospace fw-bold text-primary">${office.code}</td>
                        <td class="fw-bold">${office.name}</td>
                        <td class="text-muted">—</td>
                        <td class="text-muted">—</td>
                        <td><span class="status-badge status-matched">Activo</span></td>
                        <td class="text-end">
                            <button class="btn btn-link p-0 text-muted btn-edit-office" data-office-id="${office.id}"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn btn-link p-0 text-muted btn-delete-office" data-office-id="${office.id}"><span class="material-symbols-outlined">delete</span></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                // Re-inicializar los event listeners para los nuevos botones
                reinitializeOfficeButtons();
            }
            
            // Actualizar estadísticas
            updateStats('offices', result.stats);
        }
    } catch (error) {
        console.error('Error loading offices:', error);
    }
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
 * Re-inicializa los botones de editar/eliminar usuario después de actualizar la tabla
 */
function reinitializeUserButtons() {
    // Botones de Editar Usuario
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            const email = row.querySelector('td:nth-child(2)').textContent;
            const role = row.querySelector('td:nth-child(3)').textContent.trim();
            const isActive = row.querySelector('.status-badge').classList.contains('status-matched');
            
            document.getElementById('userId').value = userId;
            document.getElementById('userFormAction').value = 'edit';
            document.getElementById('userUsername').value = username;
            document.getElementById('userEmail').value = email !== '—' ? email : '';
            document.getElementById('userPassword').value = '';
            document.getElementById('userIsActive').checked = isActive;
            
            const roleSelect = document.getElementById('userRole');
            for (let option of roleSelect.options) {
                if (option.text === role) {
                    option.selected = true;
                    break;
                }
            }
            
            document.getElementById('modalUserLabel').textContent = 'Editar Usuario';
            userModal.show();
        });
    });

    // Botones de Eliminar Usuario
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar el usuario "${username}"?`)) {
                deleteItem(`/admin-panel/users/${userId}/delete/`, 'usuario');
            }
        });
    });
}

/**
 * Re-inicializa los botones de editar/eliminar operación después de actualizar la tabla
 */
function reinitializeOperationButtons() {
    document.querySelectorAll('.btn-edit-operation').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            const row = this.closest('tr');
            const code = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('td:nth-child(2)').textContent;
            const description = row.querySelector('td:nth-child(3)').textContent;
            
            document.getElementById('operationId').value = operationId;
            document.getElementById('operationFormAction').value = 'edit';
            document.getElementById('operationCode').value = code;
            document.getElementById('operationName').value = name;
            document.getElementById('operationDescription').value = description !== '—' ? description : '';
            
            document.getElementById('modalOperationLabel').textContent = 'Editar Operación';
            operationModal.show();
        });
    });

    document.querySelectorAll('.btn-delete-operation').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const operationId = this.getAttribute('data-operation-id');
            const row = this.closest('tr');
            const operationName = row.querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar la operación "${operationName}"?`)) {
                deleteItem(`/admin-panel/operations/${operationId}/delete/`, 'operación');
            }
        });
    });
}

/**
 * Re-inicializa los botones de editar/eliminar banco después de actualizar la lista
 */
function reinitializeBankButtons() {
    document.querySelectorAll('.btn-edit-bank').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            const bankItem = this.closest('.bank-item');
            const name = bankItem.querySelector('.bank-name').textContent;
            const code = bankItem.querySelector('.bank-description').textContent;
            
            document.getElementById('bankId').value = bankId;
            document.getElementById('bankFormAction').value = 'edit';
            document.getElementById('bankCode').value = code;
            document.getElementById('bankName').value = name;
            
            document.getElementById('modalBankLabel').textContent = 'Editar Cuenta Bancaria';
            bankModal.show();
        });
    });

    document.querySelectorAll('.btn-delete-bank').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const bankId = this.getAttribute('data-bank-id');
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar la cuenta bancaria "${bankName}"?`)) {
                deleteItem(`/admin-panel/bank-accounts/${bankId}/delete/`, 'cuenta bancaria');
            }
        });
    });
}

/**
 * Re-inicializa los botones de editar/eliminar oficina después de actualizar la tabla
 */
function reinitializeOfficeButtons() {
    document.querySelectorAll('.btn-edit-office').forEach(btn => {
        btn.removeEventListener('click', arguments.callee);
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
        btn.removeEventListener('click', arguments.callee);
        btn.addEventListener('click', function() {
            const officeId = this.getAttribute('data-office-id');
            const row = this.closest('tr');
            const officeName = row.querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`¿Está seguro que desea eliminar la oficina "${officeName}"?`)) {
                deleteItem(`/admin-panel/offices/${officeId}/delete/`, 'oficina');
            }
        });
    });
}
}