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
            setTimeout(() => location.reload(), 1000);
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
            setTimeout(() => location.reload(), 1000);
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
            setTimeout(() => location.reload(), 1000);
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
            setTimeout(() => location.reload(), 1000);
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
            setTimeout(() => location.reload(), 1000);
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