/*
   ETECSA Finanzas - Reconciliation JavaScript
   Funcionalidad para gestionar transacciones bancarias
*/

document.addEventListener('DOMContentLoaded', function() {
    initializeReconciliation();
});

// ===== Inicialización General =====
function initializeReconciliation() {
    setupFilterListeners();
    setupTableListeners();
    setupPaginationListeners();
    setupExportListener();
    console.log('Reconciliation module initialized');
}

// ===== Filtros =====
function setupFilterListeners() {
    const filterBtn = document.getElementById('filterBtn');
    const dateInput = document.getElementById('dateRange');
    const bankSelect = document.getElementById('bankFilter');
    const statusSelect = document.getElementById('statusFilter');

    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }

    // Buscar en tiempo real (opcional)
    if (dateInput) {
        dateInput.addEventListener('change', applyFilters);
    }
    if (bankSelect) {
        bankSelect.addEventListener('change', applyFilters);
    }
    if (statusSelect) {
        statusSelect.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const dateRange = document.getElementById('dateRange')?.value;
    const bank = document.getElementById('bankFilter')?.value;
    const status = document.getElementById('statusFilter')?.value;

    console.log('Aplicando filtros:', { dateRange, bank, status });

    // Aquí se enviaría una solicitud AJAX al servidor
    // Por ahora, simulamos filtrado local
    filterTransactions(bank, status);

    showNotification('Filtros aplicados correctamente', 'success');
}

function filterTransactions(bank, status) {
    const rows = document.querySelectorAll('tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        let show = true;

        // Filtrar por banco
        if (bank && bank !== 'Todos los Bancos') {
            const bankText = row.querySelector('.bank-name')?.textContent || '';
            show = show && bankText.includes(bank);
        }

        // Filtrar por estado
        if (status && status !== 'Estado: Todos') {
            const statusText = row.querySelector('.status-badge')?.textContent.trim().toLowerCase() || '';
            show = show && statusText.includes(status.toLowerCase());
        }

        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    console.log(`Se muestran ${visibleCount} transacciones`);
}

// ===== Tabla y Acciones =====
function setupTableListeners() {
    setupCheckboxListeners();
    setupRowActions();
}

function setupCheckboxListeners() {
    const masterCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('input[name="row-select"]');

    if (masterCheckbox) {
        masterCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActionsVisibility();
        });
    }

    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateMasterCheckbox();
            updateBulkActionsVisibility();
        });
    });
}

function updateMasterCheckbox() {
    const masterCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('input[name="row-select"]');

    if (masterCheckbox) {
        const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(rowCheckboxes).some(cb => cb.checked);

        masterCheckbox.checked = allChecked;
        masterCheckbox.indeterminate = someChecked && !allChecked;
    }
}

function updateBulkActionsVisibility() {
    const rowCheckboxes = document.querySelectorAll('input[name="row-select"]');
    const selectedCount = Array.from(rowCheckboxes).filter(cb => cb.checked).length;

    const bulkActions = document.getElementById('bulkActions');
    if (bulkActions) {
        bulkActions.style.display = selectedCount > 0 ? 'flex' : 'none';
    }

    const selectedInfo = document.getElementById('selectedCount');
    if (selectedInfo) {
        selectedInfo.textContent = `${selectedCount} seleccionada(s)`;
    }
}

function setupRowActions() {
    // Botones de conciliar
    document.querySelectorAll('.btn-reconcile').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const reference = row.querySelector('.ref-code')?.textContent;
            reconcileTransaction(reference, row);
        });
    });

    // Botones de ver detalles
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const reference = row.querySelector('.ref-code')?.textContent;
            viewTransactionDetails(reference);
        });
    });

    // Botones de error/revisar
    document.querySelectorAll('.btn-error').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const reference = row.querySelector('.ref-code')?.textContent;
            reviewError(reference);
        });
    });
}

function reconcileTransaction(reference, row) {
    const statusBadge = row.querySelector('.status-badge');
    if (!statusBadge) return;

    const currentStatus = statusBadge.textContent.trim().toLowerCase();

    if (currentStatus === 'pending' || currentStatus === 'pending') {
        // Cambiar estado a Matched
        statusBadge.className = 'status-badge status-matched';
        statusBadge.textContent = 'Matched';

        // Reemplazar botón
        const actionCell = row.querySelector('td:last-child');
        actionCell.innerHTML = '<button class="action-btn btn-view" title="Ver detalles"><i class="material-symbols-outlined">visibility</i></button>';
        setupRowActions();

        showNotification(`Transacción ${reference} conciliada exitosamente`, 'success');
        console.log('Transacción conciliada:', reference);
    }
}

function viewTransactionDetails(reference) {
    console.log('Ver detalles:', reference);
    showNotification(`Abriendo detalles de ${reference}`, 'info');
    // Aquí se abre un modal o navega a página de detalles
}

function reviewError(reference) {
    console.log('Revisar error:', reference);
    const row = Array.from(document.querySelectorAll('tbody tr'))
        .find(r => r.querySelector('.ref-code')?.textContent === reference);

    if (row) {
        row.classList.add('highlight-error');
        setTimeout(() => row.classList.remove('highlight-error'), 2000);
    }

    showNotification(`Por favor revise la discrepancia en ${reference}`, 'warning');
}

// ===== Paginación =====
function setupPaginationListeners() {
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            if (this.classList.contains('disabled')) return;

            const page = this.textContent.trim();
            console.log('Ir a página:', page);

            // Actualizar botón activo
            document.querySelectorAll('.pagination-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');

            showNotification(`Cargando página ${page}`, 'info');
            // Aquí se enviaría la solicitud al servidor
        });
    });
}

// ===== Exportar =====
function setupExportListener() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
}

function exportToCSV() {
    console.log('Exportando a CSV...');

    // Obtener datos de la tabla
    const table = document.querySelector('.reconciliation-table');
    const rows = Array.from(table.querySelectorAll('tbody tr'))
        .filter(row => row.style.display !== 'none');

    if (rows.length === 0) {
        showNotification('No hay datos para exportar', 'warning');
        return;
    }

    // Construir CSV
    let csv = 'Fecha,Referencia,Banco,Entidad,Monto,Estado\n';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const date = cells[1]?.textContent.trim() || '';
        const reference = cells[2]?.textContent.trim() || '';
        const bank = cells[3]?.textContent.trim() || '';
        const entity = cells[4]?.textContent.trim() || '';
        const amount = cells[5]?.textContent.trim() || '';
        const status = cells[6]?.textContent.trim() || '';

        csv += `"${date}","${reference}","${bank}","${entity}","${amount}","${status}"\n`;
    });

    // Descargar archivo
    downloadFile(csv, 'reconciliacion.csv', 'text/csv');
    showNotification('Archivo exportado exitosamente', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}

// ===== Notificaciones =====
function showNotification(message, type = 'info') {
    // Si existe un contenedor de notificaciones en Bootstrap, usarlo
    const notificationContainer = document.getElementById('notifications');

    if (notificationContainer) {
        // Usando Bootstrap
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="animation: slideIn 0.3s ease;">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        notificationContainer.innerHTML += alertHTML;

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            const alerts = notificationContainer.querySelectorAll('.alert');
            if (alerts.length > 0) {
                const lastAlert = alerts[alerts.length - 1];
                lastAlert.remove();
            }
        }, 5000);
    } else {
        // Fallback: console log
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ===== Utilidades =====
function getSelectedRowReferences() {
    const selected = document.querySelectorAll('input[name="row-select"]:checked');
    return Array.from(selected).map(checkbox => {
        const row = checkbox.closest('tr');
        return row.querySelector('.ref-code')?.textContent;
    }).filter(ref => ref);
}

function resetFilters() {
    document.getElementById('dateRange').value = '';
    document.getElementById('bankFilter').value = 'Todos los Bancos';
    document.getElementById('statusFilter').value = 'Estado: Todos';

    document.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = '';
    });

    showNotification('Filtros restablecidos', 'info');
}

// ===== Animaciones CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    tr.highlight-error {
        background-color: rgba(186, 26, 26, 0.05) !important;
    }
`;
document.head.appendChild(style);
