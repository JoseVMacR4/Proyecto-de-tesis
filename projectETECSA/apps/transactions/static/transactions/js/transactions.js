/**
 * ====================================
 * TRANSACTIONS / INFORMES - JavaScript
 * ====================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Transactions JS loaded');
    
    // Initialize event listeners
    initializeEventListeners();
    initializeTableSearch();
    initializeFilters();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Generate Report Button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }
    
    // Table row clicks
    const tableRows = document.querySelectorAll('.table-custom tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
    
    // Pagination buttons
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', handlePagination);
    });
}

/**
 * Handle Generate Report action
 */
function handleGenerateReport() {
    const modal = createModal({
        title: 'Generar Reporte',
        body: `
            <div class="mb-3">
                <label class="form-label fw-bold">Tipo de Reporte</label>
                <select class="form-select" id="reportType">
                    <option>Resumen Mensual</option>
                    <option>Detalle de Transacciones</option>
                    <option>Discrepancias</option>
                    <option>Análisis de Operadores</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Formato</label>
                <div class="btn-group w-100" role="group">
                    <input type="radio" class="btn-check" name="format" id="pdf" value="pdf" checked>
                    <label class="btn btn-outline-primary" for="pdf">PDF</label>
                    <input type="radio" class="btn-check" name="format" id="csv" value="csv">
                    <label class="btn btn-outline-primary" for="csv">CSV</label>
                    <input type="radio" class="btn-check" name="format" id="excel" value="excel">
                    <label class="btn btn-outline-primary" for="excel">Excel</label>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Período</label>
                <input type="text" class="form-control" id="periodRange" placeholder="01/04/2026 - 20/04/2026">
            </div>
        `,
        actions: [
            { label: 'Cancelar', class: 'btn-secondary', callback: closeModal },
            { label: 'Generar', class: 'btn-primary', callback: confirmGenerateReport }
        ]
    });
    
    showModal(modal);
}

/**
 * Confirm and process report generation
 */
function confirmGenerateReport() {
    const reportType = document.getElementById('reportType')?.value;
    const format = document.querySelector('input[name="format"]:checked')?.value;
    const period = document.getElementById('periodRange')?.value;
    
    if (!reportType || !format || !period) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }
    
    console.log('Generating report:', { reportType, format, period });
    
    showNotification('Generando reporte...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification(`Reporte ${reportType} generado en ${format.toUpperCase()}`, 'success');
        closeModal();
    }, 2000);
}

/**
 * Initialize table search functionality
 */
function initializeTableSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        input.addEventListener('keyup', function(e) {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.table-container')?.querySelector('.table-custom');
            
            if (!table) return;
            
            const rows = table.querySelectorAll('tbody tr');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            
            console.log(`Found ${visibleCount} results for "${searchTerm}"`);
        });
    });
}

/**
 * Initialize filter functionality
 */
function initializeFilters() {
    const searchBtn = document.querySelector('.btn:has(.material-symbols-outlined:contains("search"))');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleFilterSearch);
    }
    
    const refreshBtns = document.querySelectorAll('.btn:has(.material-symbols-outlined:contains("refresh"))');
    refreshBtns.forEach(btn => {
        btn.addEventListener('click', resetFilters);
    });
}

/**
 * Handle filter search
 */
function handleFilterSearch() {
    const dateRange = document.getElementById('dateRange')?.value;
    const typeFilter = document.querySelector('[id*="typeFilter"]')?.value;
    const statusFilter = document.querySelector('[id*="statusFilter"]')?.value;
    
    console.log('Applying filters:', { dateRange, typeFilter, statusFilter });
    showNotification('Filtros aplicados correctamente', 'success');
}

/**
 * Reset all filters
 */
function resetFilters() {
    // Reset date range
    const dateInputs = document.querySelectorAll('input[placeholder*="fecha"], input[id*="Range"]');
    dateInputs.forEach(input => {
        input.value = '';
    });
    
    // Reset selects
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Reset table display
    const tableRows = document.querySelectorAll('.table-custom tbody tr');
    tableRows.forEach(row => {
        row.style.display = '';
    });
    
    showNotification('Filtros restablecidos', 'info');
}

/**
 * Handle pagination
 */
function handlePagination(e) {
    const pageNum = e.target.textContent;
    if (!isNaN(pageNum)) {
        // Remove active class from all
        document.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Add active to clicked
        e.target.classList.add('active');
        console.log('Navigating to page:', pageNum);
    }
}

/**
 * Show notification helper
 */
function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'warning': 'alert-warning',
        'error': 'alert-danger',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const alertHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const notificationsContainer = document.getElementById('notifications') || 
        document.querySelector('main');
    
    if (notificationsContainer) {
        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = alertHTML;
        notificationsContainer.insertBefore(alertDiv.firstElementChild, notificationsContainer.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.firstElementChild.remove();
        }, 5000);
    }
}

/**
 * Create modal helper
 */
function createModal(options) {
    const { title, body, actions } = options;
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header border-bottom">
                    <h5 class="modal-title font-manrope fw-bold">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${body}
                </div>
                <div class="modal-footer border-top">
                    ${actions.map(action => `
                        <button type="button" class="btn ${action.class}" data-action="${action.label}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners to action buttons
    modal.querySelectorAll('.modal-footer button').forEach((btn, index) => {
        btn.addEventListener('click', actions[index]?.callback);
    });
    
    return modal;
}

/**
 * Show modal
 */
function showModal(modal) {
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.querySelector('.modal.show');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

/**
 * Utility: Format currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

/**
 * Utility: Format date
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// Export for use in other modules
window.TransactionsApp = {
    showNotification,
    formatCurrency,
    formatDate,
    resetFilters,
    handleGenerateReport
};
