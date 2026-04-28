/**
 * Bank Accounts Page JavaScript
 * Handles interactions for file uploads and account statements management
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Bank Accounts Module Initialized');

    // Initialize event listeners
    initializeFileUpload();
    initializeHistoryActions();
    initializeDragAndDrop();
    initializePagination();
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
        document.body.addEventListener(eventName, preventDefaults, false);
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
 * Handle file upload
 */
function handleFileUpload(files) {
    console.log(`Files selected: ${files.length}`);
    
    const allowedExtensions = ['pdf', 'csv', 'xlsx', 'xls'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB (según el template)
    const validFiles = [];
    const errors = [];

    for (let file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(ext)) {
            errors.push(`${file.name}: Formato no permitido. Use PDF, CSV o XLSX.`);
            continue;
        }

        if (file.size > maxFileSize) {
            errors.push(`${file.name}: El archivo excede 5MB.`);
            continue;
        }

        validFiles.push(file);
    }

    if (errors.length > 0) {
        showNotification('Errores en los archivos:\n\n' + errors.join('\n'), 'error');
        return;
    }

    if (validFiles.length > 0) {
        // Upload each file to the server
        validFiles.forEach(file => {
            uploadFileToServer(file);
        });
    }
}

/**
 * Upload file to server via AJAX
 */
function uploadFileToServer(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Show loading state
    showNotification(`Cargando archivo: ${file.name}`, 'info');

    fetch('/bank-accounts/api/upload/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            // Optionally reload the page or update the table
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else if (data.status === 'warning') {
            showNotification(data.message, 'warning');
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        showNotification('Error al cargar el archivo. Por favor intente nuevamente.', 'error');
    });
}

/**
 * Get CSRF token from cookies
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
 * History table actions
 */
function initializeHistoryActions() {
    const actionButtons = document.querySelectorAll('.upload-history-table .action-btn');

    actionButtons.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = btn.closest('tr');
            const fileName = row.querySelector('.file-name')?.textContent || 'archivo desconocido';
            const iconText = btn.querySelector('.material-symbols-outlined')?.textContent || '';
            const isViewBtn = iconText.includes('visibility');

            if (isViewBtn) {
                console.log('Ver archivo:', fileName);
                showNotification(`Ver detalles de: ${fileName}`, 'info');
            } else {
                console.log('Eliminar archivo:', fileName);
                if (confirm(`¿Está seguro que desea eliminar ${fileName}?`)) {
                    row.style.opacity = '0.5';
                    showNotification('Archivo eliminado exitosamente', 'success');
                    setTimeout(() => {
                        row.remove();
                    }, 300);
                }
            }
        });
    });
}

/**
 * Pagination functionality
 */
function initializePagination() {
    const paginationBtns = document.querySelectorAll('.pagination-btn');

    paginationBtns.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const icon = btn.querySelector('.material-symbols-outlined')?.textContent || '';
            const isNumber = !icon;

            if (isNumber) {
                console.log('Ir a página:', btn.textContent);
                showNotification(`Ir a página ${btn.textContent}`, 'info');
            } else if (icon.includes('chevron_left')) {
                console.log('Página anterior');
                showNotification('Ir a página anterior', 'info');
            } else if (icon.includes('chevron_right')) {
                console.log('Página siguiente');
                showNotification('Ir a página siguiente', 'info');
            }
        });
    });
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

/**
 * Show notification using the existing notification system
 */
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notifications');

    if (notificationContainer) {
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

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alerts = notificationContainer.querySelectorAll('.alert');
            if (alerts.length > 0) {
                const lastAlert = alerts[alerts.length - 1];
                lastAlert.remove();
            }
        }, 5000);
    } else {
        // Fallback: alert
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}