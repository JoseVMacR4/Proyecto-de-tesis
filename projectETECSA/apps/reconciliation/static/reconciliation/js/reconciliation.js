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
    setupJumpListeners();
    setupExportListener();
    setupFilterToggle();

    // Cargar opciones de filtro primero, luego los datos
    loadFilterOptions().then(() => {
        loadTransactions();
    });
}

// ===== Filtros =====
function setupFilterListeners() {
    const filterInputs = document.querySelectorAll('.filter-input, .filter-select');

    // Aplicar filtros automáticamente al cambiar cualquier input
    filterInputs.forEach(input => {
        input.addEventListener('change', applyFilters);
        input.addEventListener('input', debounce(applyFilters, 500));
    });
}

let currentFilters = { page: 1 };

function applyFilters() {
    currentFilters = {
        date_from: document.getElementById('dateFrom')?.value || '',
        date_to: document.getElementById('dateTo')?.value || '',
        bank: document.getElementById('bankFilter')?.value || '',
        status: document.getElementById('statusFilter')?.value || '',
        reference: document.getElementById('referenceFilter')?.value || '',
        name: document.getElementById('nameFilter')?.value || '',
        office_code: document.getElementById('officeFilter')?.value || '',
        entry_type: document.getElementById('entryTypeFilter')?.value || '',
        operation_type: document.getElementById('operationTypeFilter')?.value || '',
        amount_min: document.getElementById('amountMinFilter')?.value || '',
        amount_max: document.getElementById('amountMaxFilter')?.value || '',
        currency: document.getElementById('currencyFilter')?.value || '',
        page: 1 // Al filtrar, siempre volvemos a la página 1
    };

    loadTransactions(currentFilters);
}

function loadFilterOptions() {
    console.log('Loading filter options...');
    return fetch('/reconciliation/api/filters/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        console.log('Filter options response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Filter options data:', data);
        if (data.status === 'success') {
            populateFilterOptions(data.filters);
            console.log('Filter options populated successfully');
        } else {
            console.error('Error loading filter options:', data);
        }
    })
    .catch(error => {
        console.error('Error loading filter options:', error);
    });
}

function populateFilterOptions(filters) {
    // Poblar bancos
    const bankSelect = document.getElementById('bankFilter');
    bankSelect.innerHTML = '';
    filters.banks.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        bankSelect.appendChild(opt);
    });

    // Poblar tipos de entrada
    const entryTypeSelect = document.getElementById('entryTypeFilter');
    entryTypeSelect.innerHTML = '';
    filters.entry_types.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        entryTypeSelect.appendChild(opt);
    });

    // Poblar monedas
    const currencySelect = document.getElementById('currencyFilter');
    currencySelect.innerHTML = '';
    filters.currencies.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        currencySelect.appendChild(opt);
    });

    // Poblar oficinas
    const officeSelect = document.getElementById('officeFilter');
    officeSelect.innerHTML = '';
    filters.offices.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        officeSelect.appendChild(opt);
    });

    // Poblar tipos de operación
    const operationTypeSelect = document.getElementById('operationTypeFilter');
    operationTypeSelect.innerHTML = '';
    filters.operation_types.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        operationTypeSelect.appendChild(opt);
    });
}

function updateTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center py-5 text-muted">No se encontraron transacciones bancarias.</td></tr>';
        return;
    }

    transactions.forEach(tx => {
        const row = createTransactionRow(tx);
        tbody.appendChild(row);
    });

    // Re-inicializar listeners para las nuevas filas
    setupRowActions();
    setupCheckboxListeners();
}

function createTransactionRow(tx) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-date', tx.date);
    tr.setAttribute('data-current-reference', tx.reference);
    tr.setAttribute('data-original-reference', tx.original_reference || '--');
    tr.setAttribute('data-bank', tx.bank);
    tr.setAttribute('data-office', tx.office || '--');
    tr.setAttribute('data-operations', tx.operations);
    tr.setAttribute('data-amount', tx.amount);
    tr.setAttribute('data-bank-fee', tx.bank_fee);
    tr.setAttribute('data-entry-type', tx.entry_type);
    tr.setAttribute('data-status-display', tx.status_display);
    tr.setAttribute('data-name', tx.entity);
    tr.setAttribute('data-operation-type', tx.operation_type || '--');
    tr.setAttribute('data-currency', tx.currency);
    tr.setAttribute('data-created-at', tx.created_at || '--');
    tr.setAttribute('data-updated-at', tx.updated_at || '--');

    const amountClass = tx.entry_type === 'Db' ? 'error' : 'primary';
    const amountSign = tx.entry_type === 'Db' ? '-' : '';
    const statusClass = tx.status === 'reconciled' ? 'status-matched' : 'status-pending';
    const statusText = tx.status_display;

    tr.innerHTML = `
        <td><input type="checkbox" name="row-select" class="form-check-input"></td>
        <td>${tx.date}</td>
        <td class="font-monospace ref-code">${tx.reference}</td>
        <td class="font-monospace">${tx.original_reference || '--'}</td>
        <td class="bank-name">${tx.bank}</td>
        <td>${tx.office || '--'}</td>
        <td class="text-center">${tx.operations}</td>
        <td class="text-end amount ${amountClass}">${amountSign}${tx.amount}</td>
        <td class="text-center">${tx.entry_type}</td>
        <td class="text-center">
            <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="text-end">
            <div class="d-flex gap-2 justify-content-end">
                <button class="action-btn btn-view" title="Ver detalles">
                    <span class="material-symbols-outlined">visibility</span>
                </button>
                ${tx.status === 'pending' ? `
                <button class="btn-reconcile" data-transaction-id="${tx.id}" title="Conciliar">
                    <span class="material-symbols-outlined" style="font-size: 0.9rem;">sync</span>
                </button>
                ` : ''}
            </div>
        </td>
    `;

    return tr;
}

function updatePagination(data) {
    // 1. Actualizar el texto "Mostrando X - Y de Z"
    const infoElement = document.querySelector('.pagination-info');
    if (infoElement) {
        infoElement.textContent = `Mostrando ${data.start_index} - ${data.end_index} de ${data.total_transactions} transacciones`;
    }

    // 2. Reconstruir los botones de paginación para usar AJAX
    const paginationContainers = document.querySelectorAll('.pagination-controls');
    
    paginationContainers.forEach(container => {
        // Salvaguardar el botón "Ir Arriba" si existe dentro del contenedor
        const jumpToTopBtn = container.querySelector('#jumpToTopBtn');
        let html = '';
        
        if (jumpToTopBtn) {
            html += jumpToTopBtn.outerHTML;
        }

        // Botón Anterior
        if (data.page > 1) {
            html += `<button class="pagination-btn page-link-btn" data-page="${data.page - 1}" title="Página anterior">
                        <span class="material-symbols-outlined">chevron_left</span>
                     </button>`;
        } else {
            html += `<span class="pagination-btn disabled" aria-disabled="true" style="pointer-events: none; opacity: 0.5;">
                        <span class="material-symbols-outlined">chevron_left</span>
                     </span>`;
        }

        // Rango de páginas dinámico (ventana de 5 páginas)
        let startPage = Math.max(1, data.page - 2);
        let endPage = Math.min(data.total_pages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === data.page) {
                html += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
            } else {
                html += `<button class="pagination-btn page-link-btn" data-page="${i}">${i}</button>`;
            }
        }

        // Botón Siguiente
        if (data.page < data.total_pages) {
            html += `<button class="pagination-btn page-link-btn" data-page="${data.page + 1}" title="Página siguiente">
                        <span class="material-symbols-outlined">chevron_right</span>
                     </button>`;
        } else {
            html += `<span class="pagination-btn disabled" aria-disabled="true" style="pointer-events: none; opacity: 0.5;">
                        <span class="material-symbols-outlined">chevron_right</span>
                     </span>`;
        }

        container.innerHTML = html;
    });

    // 3. Volver a conectar los listeners de los botones recién creados
    setupPaginationListeners();
    
    // Si se reescribió el botón jumpToTop, asegurar que su evento persista
    const newJumpBtn = document.getElementById('jumpToTopBtn');
    if (newJumpBtn) {
        newJumpBtn.addEventListener('click', function() {
            document.querySelector('.reconciliation-table').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

function setupFilterToggle() {
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const filterContainer = document.getElementById('filterContainer');

    if (toggleBtn && filterContainer) {
        toggleBtn.addEventListener('click', function() {
            const isHidden = filterContainer.style.display === 'none';
            
            // Alternar visibilidad
            filterContainer.style.display = isHidden ? 'block' : 'none';
            
            // Actualizar ícono y texto
            const icon = this.querySelector('.expand-icon');
            const text = document.getElementById('toggleFiltersText');
            
            if (icon) {
                icon.textContent = isHidden ? 'expand_less' : 'expand_more';
            }
            if (text) {
                text.textContent = isHidden ? 'Ocultar Filtros' : 'Mostrar Filtros';
            }
        });
    }
}

// Única versión correcta de resetFilters
function resetFilters() {
    const filterInputs = document.querySelectorAll('.filter-input, .filter-select');
    
    filterInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
    });
    
    // Disparar la búsqueda nuevamente (hace reset en el backend)
    applyFilters();
}

function loadTransactions(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const url = `/reconciliation/api/data/?${queryString}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Es vital que estas funciones se ejecuten en orden
            updateTable(data.transactions);    // Esto llena la tabla
            updatePagination(data);           // Esto actualiza el texto de "Mostrando..."
            updateStats(data);                // Esto ahora no hace nada con el Total
        }
    })
    .catch(error => console.error('Error:', error));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
            const transactionId = this.getAttribute('data-transaction-id');
            const row = this.closest('tr');
            
            if (transactionId && row) {
                openReconcileConfirmModal(transactionId, row);
            }
        });
    });

    // Botones de ver detalles
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            viewTransactionDetails(row);
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

function openReconcileConfirmModal(transactionId, row) {
    if (!row) return;

    const data = row.dataset;
    const modalElement = document.getElementById('reconcileConfirmModal');
    if (!modalElement) return;

    // Poblar campos con manejo de errores si el elemento no existe
    const setContent = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '--';
    };

    setContent('confirmDate', data.date);
    setContent('confirmReference', data.currentReference);
    setContent('confirmOriginalReference', data.originalReference);
    setContent('confirmBank', data.bank);
    setContent('confirmOffice', data.office);
    setContent('confirmOperations', data.operations);
    setContent('confirmAmount', `${data.entryType === 'Db' ? '-' : ''}${data.amount}`);
    setContent('confirmBankFee', data.bankFee);
    setContent('confirmEntryType', data.entryType);
    setContent('confirmName', data.name);
    setContent('confirmOperationType', data.operationType);
    setContent('confirmCurrency', data.currency);

    // Configurar el botón de confirmar dentro del modal
    const confirmBtn = document.getElementById('confirmReconcileBtn');
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            reconcileTransaction(transactionId, row);
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        };
    }

    // Abrir el modal usando Bootstrap 5
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();
}

function reconcileTransaction(transactionId, row) {
    fetch('/reconciliation/api/reconcile/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ 'transaction_id': transactionId })
    })
    .then(response => {
        if (!response.ok) {
            // Si el status es 400, aquí capturamos el error de formato del ID
            return response.json().then(err => { throw new Error(err.message); });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'status-badge status-matched';
                statusBadge.textContent = 'Conciliado';
            }
            row.dataset.statusDisplay = 'Conciliado';
            if (data.updated_at) {
                row.dataset.updatedAt = data.updated_at;
            }
            row.querySelector('.btn-reconcile')?.remove();
            updateReconciliationSummaryStats();
            showNotification(data.message, 'success');
        }
    })
    .catch(error => {
        console.error('Error capturado:', error);
        showNotification(error.message, 'error');
    });
}

function updateReconciliationSummaryStats() {
    const totalEl = document.getElementById('totalCount');
    const reconciledEl = document.getElementById('reconciledCount');
    const pendingEl = document.getElementById('pendingCount');
    const percentageEl = document.getElementById('reconciledPercentage');

    if (!totalEl || !reconciledEl || !pendingEl || !percentageEl) return;

    const parseNumber = (text) => {
        if (!text) return 0;
        return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    };

    const totalCount = parseNumber(totalEl.textContent);
    const reconciledCount = parseNumber(reconciledEl.textContent) + 1;
    const pendingCount = Math.max(parseNumber(pendingEl.textContent) - 1, 0);

    reconciledEl.textContent = reconciledCount.toLocaleString('es-ES');
    pendingEl.textContent = pendingCount.toLocaleString('es-ES');
    percentageEl.textContent = totalCount > 0 ? Math.round((reconciledCount / totalCount) * 100) : '0';
}

function viewTransactionDetails(row) {
    if (!row) return;

    const data = row.dataset;
    const modalElement = document.getElementById('transactionDetailModal');
    if (!modalElement) return;

    document.getElementById('detailDate').textContent = data.date || '';
    document.getElementById('detailReference').textContent = data.currentReference || '';
    document.getElementById('detailOriginalReference').textContent = data.originalReference || '';
    document.getElementById('detailBank').textContent = data.bank || '';
    document.getElementById('detailOffice').textContent = data.office || '';
    document.getElementById('detailOperations').textContent = data.operations || '';
    document.getElementById('detailAmount').textContent = data.amount || '';
    document.getElementById('detailEntryType').textContent = data.entryType || '';
    document.getElementById('detailStatus').textContent = data.statusDisplay || '';
    document.getElementById('detailName').textContent = data.name || '';
    document.getElementById('detailOperationType').textContent = data.operationType || '';
    document.getElementById('detailBankFee').textContent = data.bankFee || '';
    document.getElementById('detailCurrency').textContent = data.currency || '';
    document.getElementById('detailCreatedAt').textContent = data.createdAt || '';
    document.getElementById('detailUpdatedAt').textContent = data.updatedAt || '';

    // Uso correcto de la API de Bootstrap 5 para abrir el modal
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.show();
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
    // Seleccionamos los nuevos botones creados dinámicamente con la clase 'page-link-btn'
    document.querySelectorAll('.page-link-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.classList.contains('disabled') || this.classList.contains('active')) return;

            const targetPage = this.getAttribute('data-page');
            
            if (targetPage) {
                // Actualizamos la página de los filtros activos sin borrarlos
                currentFilters.page = parseInt(targetPage);
                
                // Cargar transacciones preservando los filtros
                loadTransactions(currentFilters);
            }
        });
    });
}

// ===== Exportar =====
function setupJumpListeners() {
    const jumpDownBtn = document.getElementById('jumpDownBtn');
    const jumpToTopBtn = document.getElementById('jumpToTopBtn');

    if (jumpDownBtn) {
        jumpDownBtn.addEventListener('click', function() {
            scrollToElement('#paginationBottom');
        });
    }

    if (jumpToTopBtn) {
        jumpToTopBtn.addEventListener('click', function() {
            scrollToElement('.reconciliation-table');
        });
    }
}

function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
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
