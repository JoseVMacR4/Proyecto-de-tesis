/**
 * ETECSA Finanzas - Admin Panel JavaScript
 * Gestión de usuarios, operaciones, cuentas bancarias y oficinas
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tabs
    initTabs();

    // Inicializar botones de acción
    initActionButtons();
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
 * Inicializa los botones de acción (editar, eliminar, agregar)
 */
function initActionButtons() {
    // Botón Agregar Usuario
    const btnAddUser = document.getElementById('btnAddUser');
    if (btnAddUser) {
        btnAddUser.addEventListener('click', function() {
            alert('Funcionalidad: Abrir modal para crear nuevo usuario');
            // Aquí iría la lógica para abrir un modal o formulario
        });
    }

    // Botón Agregar Operación
    const btnAddOperation = document.getElementById('btnAddOperation');
    if (btnAddOperation) {
        btnAddOperation.addEventListener('click', function() {
            alert('Funcionalidad: Abrir modal para crear nueva operación');
        });
    }

    // Botón Agregar Cuenta Bancaria
    const btnAddBank = document.getElementById('btnAddBank');
    if (btnAddBank) {
        btnAddBank.addEventListener('click', function() {
            alert('Funcionalidad: Abrir modal para crear nueva cuenta bancaria');
        });
    }

    // Botón Agregar Oficina
    const btnAddOffice = document.getElementById('btnAddOffice');
    if (btnAddOffice) {
        btnAddOffice.addEventListener('click', function() {
            alert('Funcionalidad: Abrir modal para crear nueva oficina');
        });
    }

    // Botones de Editar Usuario
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            alert(`Funcionalidad: Editar usuario "${username}"`);
        });
    });

    // Botones de Eliminar Usuario
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const username = row.querySelector('td:first-child').textContent;
            if (confirm(`¿Está seguro que desea eliminar el usuario "${username}"?`)) {
                alert(`Funcionalidad: Eliminar usuario "${username}"`);
            }
        });
    });

    // Botones de Editar Operación
    document.querySelectorAll('.btn-edit-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const operationName = row.querySelector('td:nth-child(2)').textContent;
            alert(`Funcionalidad: Editar operación "${operationName}"`);
        });
    });

    // Botones de Eliminar Operación
    document.querySelectorAll('.btn-delete-operation').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const operationName = row.querySelector('td:nth-child(2)').textContent;
            if (confirm(`¿Está seguro que desea eliminar la operación "${operationName}"?`)) {
                alert(`Funcionalidad: Eliminar operación "${operationName}"`);
            }
        });
    });

    // Botones de Editar Banco
    document.querySelectorAll('.btn-edit-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            alert(`Funcionalidad: Editar cuenta bancaria "${bankName}"`);
        });
    });

    // Botones de Eliminar Banco
    document.querySelectorAll('.btn-delete-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            if (confirm(`¿Está seguro que desea eliminar la cuenta bancaria "${bankName}"?`)) {
                alert(`Funcionalidad: Eliminar cuenta bancaria "${bankName}"`);
            }
        });
    });

    // Botones de Editar Oficina
    document.querySelectorAll('.btn-edit-office').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const officeName = row.querySelector('td:nth-child(2)').textContent;
            alert(`Funcionalidad: Editar oficina "${officeName}"`);
        });
    });

    // Botones de Eliminar Oficina
    document.querySelectorAll('.btn-delete-office').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const officeName = row.querySelector('td:nth-child(2)').textContent;
            if (confirm(`¿Está seguro que desea eliminar la oficina "${officeName}"?`)) {
                alert(`Funcionalidad: Eliminar oficina "${officeName}"`);
            }
        });
    });
}