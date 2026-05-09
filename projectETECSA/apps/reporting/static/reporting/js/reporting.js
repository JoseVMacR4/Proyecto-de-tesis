/**
 * ====================================
 * TRANSACTIONS / INFORMES - JavaScript
 * ====================================
 */

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
    const searchBtn = document.querySelector('.btn-primary-gradient');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleFilterSearch);
    }
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
    const cleanMsg = cleanMessage(message);
    const alertClass = {
        'success': 'alert-success',
        'warning': 'alert-warning',
        'error': 'alert-danger',
        'info': 'alert-info'
    }[type] || 'alert-info';

    document.querySelectorAll('.reporting-alert').forEach(el => el.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `reporting-alert alert ${alertClass} alert-dismissible fade show`;
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

    if (type !== 'info' && typeof window.reloadNotifications === 'function') {
        setTimeout(() => window.reloadNotifications(), 500);
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

// ====================================
// CHARTS INITIALIZATION
// ====================================

const CHART_COLORS = {
    primary: '#005596',
    secondary: '#87C038',
    tertiary: '#6432AA',
    success: '#00A86B',
    error: '#C83232',
    warning: '#FFB800'
};

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        }
    }
};

async function fetchChartData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching data');
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

function initConciliationTrend() {
    const canvas = document.getElementById('conciliationTrendChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/conciliation-trend/').then(data => {
        if (!data) return;

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Conciliado',
                        data: data.reconciled,
                        backgroundColor: CHART_COLORS.primary,
                        borderRadius: 4
                    },
                    {
                        label: 'Pendiente',
                        data: data.pending,
                        backgroundColor: CHART_COLORS.secondary,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

function initStatusDistribution() {
    const canvas = document.getElementById('statusDistributionChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/status-distribution/').then(data => {
        if (!data) return;

        document.getElementById('reconciledCount').textContent = data.reconciled.toLocaleString();
        document.getElementById('pendingCount').textContent = data.pending.toLocaleString();

        const percentage = data.total > 0 ? Math.round((data.reconciled / data.total) * 100) : 0;

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Conciliado', 'Pendiente'],
                datasets: [{
                    data: [data.reconciled, data.pending],
                    backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                ...chartDefaults,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = data.total;
                                const pct = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value.toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    var width = chart.width, height = chart.height, ctx = chart.ctx;
                    ctx.restore();
                    var fontSize = (height / 114).toFixed(2);
                    ctx.font = 'bold ' + fontSize + 'em Inter';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = CHART_COLORS.primary;
                    var text = percentage + '%',
                        textX = Math.round((width - ctx.measureText(text).width) / 2),
                        textY = height / 2;
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
    });
}

function initIncomeExpense() {
    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/income-expense/').then(data => {
        if (!data) return;

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: data.credits,
                        backgroundColor: CHART_COLORS.success,
                        borderRadius: 4
                    },
                    {
                        label: 'Egresos',
                        data: data.debits,
                        backgroundColor: CHART_COLORS.error,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

function initFeesEvolution() {
    const canvas = document.getElementById('feesEvolutionChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/fees-evolution/').then(data => {
        if (!data) return;

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Comisiones',
                    data: data.values,
                    borderColor: CHART_COLORS.tertiary,
                    backgroundColor: 'rgba(100, 50, 170, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: CHART_COLORS.tertiary
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

function initTopOperations() {
    const canvas = document.getElementById('topOperationsChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/top-operations/').then(data => {
        if (!data || !data.labels.length) {
            canvas.parentElement.innerHTML = '<p class="text-muted text-center py-5">No hay datos disponibles</p>';
            return;
        }

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Transacciones',
                    data: data.values,
                    backgroundColor: [
                        CHART_COLORS.primary,
                        CHART_COLORS.secondary,
                        CHART_COLORS.tertiary,
                        CHART_COLORS.success,
                        CHART_COLORS.warning
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                ...chartDefaults,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    });
}

function initAccountVolume() {
    const canvas = document.getElementById('accountVolumeChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/account-volume/').then(data => {
        if (!data || !data.labels.length) {
            canvas.parentElement.innerHTML = '<p class="text-muted text-center py-5">No hay datos disponibles</p>';
            return;
        }

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Transacciones',
                    data: data.values,
                    backgroundColor: CHART_COLORS.primary,
                    borderRadius: 4
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initConciliationTrend();
    initStatusDistribution();
    initIncomeExpense();
    initFeesEvolution();
    initTopOperations();
    initAccountVolume();
});
