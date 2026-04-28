/**
 * Bank Accounts Page JavaScript
 * Handles interactions for file uploads and account statements management
 */

// API endpoints
const API_ENDPOINTS = {
    upload: '/reconciliation/api/upload/',
    history: '/reconciliation/api/history/',
    file: '/reconciliation/api/file/'
};

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['xml', 'txt'];

// State
let currentPage = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Bank Accounts Module Initialized');

    // Initialize event listeners
    initializeFileUpload();
    initializeDragAndDrop();
    initializeHistoryActions();
    initializeFilters();
    loadHistory();
});

/**
 * File Upload Handling
 */
function initializeFileUpload() {
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const fileInput = document.getElementById('fileInput');

    if (!selectFilesBtn || !fileInput) return;

    // Click to select files
    selectFilesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
        // Reset input so same files can be selected again
        fileInput.value = '';
    });
}

/**
 * Drag and Drop functionality
 */
function initializeDragAndDrop() {
    const uploadZone = document.querySelector('.upload-zone');
    const fileInput = document.getElementById('fileInput');

    if (!uploadZone) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.style.borderColor = 'var(--primary)';
            uploadZone.style.backgroundColor = 'rgba(211, 228, 255, 0.1)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.style.borderColor = 'var(--outline-variant)';
            uploadZone.style.backgroundColor = '';
        }, false);
    });

    // Handle dropped files
    uploadZone.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    }, false);

    // Make the whole zone clickable (but not the button)
    uploadZone.addEventListener('click', function(e) {
        if (e.target.closest('#selectFilesBtn')) {
            return;
        }
        fileInput.click();
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Handle file upload with batch processing
 */
async function handleFileUpload(files) {
    console.log(`Files selected: ${files.length}`);
    
    const errors = [];
    const validFiles = [];

    // Pre-validation on client side
    for (let file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            errors.push(`${file.name}: Formato no permitido. Use XML o TXT.`);
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            errors.push(`${file.name}: El archivo excede 5MB.`);
            continue;
        }

        validFiles.push(file);
    }

    if (errors.length > 0) {
        showUploadStatus('error', 'Errores en los archivos:', errors);
        return;
    }

    if (validFiles.length === 0) {
        return;
    }

    // Show uploading status
    showUploadStatus('uploading', `Subiendo ${validFiles.length} archivo(s)...`, []);

    // Prepare FormData for batch upload
    const formData = new FormData();
    for (let file of validFiles) {
        formData.append('files', file);
    }

    try {
        const response = await fetch(API_ENDPOINTS.upload, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Update last processing time
            updateLastProcessingTime();
            
            // Show success message with file details
            const fileDetails = data.files.map(f => 
                `✓ ${f.filename} - ID: ${f.id_interno} (${f.formato}, ${formatFileSize(f.tamaño)})`
            );
            showUploadStatus('success', data.message, fileDetails);
            
            // Reload history
            loadHistory();
        } else {
            // Show error details
            let errorMessages = [];
            
            if (data.errors) {
                errorMessages = data.errors.map(e => `✗ ${e.filename}: ${e.error}`);
            } else if (data.duplicates) {
                errorMessages = data.duplicates.map(d => 
                    `✗ ${d.filename}: Duplicado (${d.banco} - ${d.fecha}) - ${d.type}`
                );
            } else {
                errorMessages = [data.message];
            }
            
            showUploadStatus('error', data.message, errorMessages);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showUploadStatus('error', 'Error de conexión al subir archivos', [error.message]);
    }
}

/**
 * Show upload status message
 */
function showUploadStatus(status, message, details) {
    const statusDiv = document.getElementById('uploadStatus');
    const statusMessage = statusDiv.querySelector('.status-message');
    const fileList = statusDiv.querySelector('.file-list');
    
    statusDiv.style.display = 'block';
    statusDiv.className = `upload-status status-${status}`;
    
    const statusIcons = {
        'success': 'check_circle',
        'error': 'error',
        'uploading': 'progress_activity'
    };
    
    statusMessage.innerHTML = `
        <span class="material-symbols-outlined">${statusIcons[status] || 'info'}</span>
        <span>${message}</span>
    `;
    
    if (details && details.length > 0) {
        fileList.innerHTML = details.map(d => `<div class="file-detail">${d}</div>`).join('');
        fileList.style.display = 'block';
    } else {
        fileList.style.display = 'none';
    }
    
    // Auto-hide after 10 seconds for success
    if (status === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 10000);
    }
}

/**
 * Update last processing time display
 */
function updateLastProcessingTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('es-CU', { day: '2-digit', month: 'short' });
    
    document.getElementById('lastProcessingTime').textContent = timeStr;
    document.getElementById('lastProcessingDate').textContent = dateStr;
}

/**
 * Load statement history from API
 */
async function loadHistory() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Cargando historial...</td></tr>';
    
    // Build query params
    const params = new URLSearchParams({
        page: currentPage,
        per_page: 20
    });
    
    // Add filters
    if (currentFilters.bank_id) params.append('bank_id', currentFilters.bank_id);
    if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
    if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);
    if (currentFilters.format) params.append('format', currentFilters.format);
    if (currentFilters.status) params.append('status', currentFilters.status);
    
    try {
        const response = await fetch(`${API_ENDPOINTS.history}?${params.toString()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            renderHistoryTable(data.results);
            renderPagination(data.count, data.page, data.total_pages);
            updatePaginationInfo(data.count, data.page, data.per_page);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error cargando historial</td></tr>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error de conexión</td></tr>';
    }
}

/**
 * Render history table rows
 */
function renderHistoryTable(results) {
    const tbody = document.getElementById('historyTableBody');
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay archivos cargados</td></tr>';
        return;
    }
    
    const statusClasses = {
        'Subido': 'uploaded',
        'Procesando': 'processing',
        'Completado': 'completed',
        'Error': 'error'
    };
    
    tbody.innerHTML = results.map(stmt => `
        <tr>
            <td><code class="internal-id">${stmt.id_interno}</code></td>
            <td>
                <div class="file-item">
                    <div class="file-icon ${stmt.formato.toLowerCase()}">
                        <span class="material-symbols-outlined">${stmt.formato === 'XML' ? 'xml' : 'description'}</span>
                    </div>
                    <div class="file-info">
                        <p class="file-name">${stmt.nombre_archivo}</p>
                        <p class="file-size">${formatFileSize(stmt.tamaño)}</p>
                    </div>
                </div>
            </td>
            <td class="bank-name">${stmt.banco.codigo}</td>
            <td class="upload-date">${stmt.fecha}</td>
            <td class="format-type">${stmt.formato}</td>
            <td class="file-size">${formatFileSize(stmt.tamaño)}</td>
            <td>
                <span class="status-badge ${statusClasses[stmt.estado] || ''}">
                    <span class="status-dot"></span>
                    ${stmt.estado}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="Ver" data-file-id="${stmt.id}" data-file-name="${stmt.nombre_archivo}">
                        <span class="material-symbols-outlined">visibility</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Attach view button handlers
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const fileId = this.dataset.fileId;
            const fileName = this.dataset.fileName;
            viewFile(fileId, fileName);
        });
    });
}

/**
 * View/download file
 */
async function viewFile(fileId, fileName) {
    try {
        const response = await fetch(`${API_ENDPOINTS.file}${fileId}/`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const error = await response.json();
            alert(`Error: ${error.message || 'No se pudo descargar el archivo'}`);
        }
    } catch (error) {
        console.error('Error viewing file:', error);
        alert('Error de conexión al intentar ver el archivo');
    }
}

/**
 * Render pagination controls
 */
function renderPagination(total, currentPage, totalPages) {
    const container = document.getElementById('paginationControls');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">chevron_left</span>
        </button>
    `;
    
    // Show page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    html += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <span class="material-symbols-outlined">chevron_right</span>
        </button>
    `;
    
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadHistory();
}

function updatePaginationInfo(total, page, perPage) {
    const info = document.getElementById('paginationInfo');
    const start = total > 0 ? (page - 1) * perPage + 1 : 0;
    const end = Math.min(total, page * perPage);
    info.textContent = `Mostrando ${start}-${end} de ${total} archivos cargados`;
}

/**
 * Initialize filter controls
 */
function initializeFilters() {
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const filterGroup = document.getElementById('filterGroup');
    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');
    
    if (!toggleBtn || !filterGroup) return;
    
    toggleBtn.addEventListener('click', function() {
        filterGroup.style.display = filterGroup.style.display === 'none' ? 'flex' : 'none';
    });
    
    applyBtn.addEventListener('click', function() {
        const bankId = document.getElementById('filterBank').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        const format = document.getElementById('filterFormat').value;
        const status = document.getElementById('filterStatus').value;
        
        currentFilters = {
            bank_id: bankId,
            date_from: dateFrom,
            date_to: dateTo,
            format: format,
            status: status
        };
        
        currentPage = 1;
        loadHistory();
    });
    
    clearBtn.addEventListener('click', function() {
        document.getElementById('filterBank').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('filterFormat').value = '';
        document.getElementById('filterStatus').value = '';
        
        currentFilters = {};
        currentPage = 1;
        loadHistory();
    });
}

/**
 * History table actions
 */
function initializeHistoryActions() {
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            alert('Funcionalidad de exportación próximamente disponible');
        });
    }
}

/**
 * Utility function to format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to format currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CU', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}
