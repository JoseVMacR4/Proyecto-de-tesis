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
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    const validFiles = [];
    const errors = [];

    for (let file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(ext)) {
            errors.push(`${file.name}: Formato no permitido. Use PDF, CSV o XLSX.`);
            continue;
        }

        if (file.size > maxFileSize) {
            errors.push(`${file.name}: El archivo excede 25MB.`);
            continue;
        }

        validFiles.push(file);
    }

    if (errors.length > 0) {
        alert('Errores en los archivos:\n\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
        // Here you would typically upload the files to the server
        console.log('Valid files to upload:', validFiles);
        
        // Show success message
        alert(`${validFiles.length} archivo(s) listo(s) para cargar.`);
        
        // Example: You could call an upload function here
        // uploadFilesToServer(validFiles);
    }
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
                alert(`Ver detalles de: ${fileName}`);
            } else {
                console.log('Eliminar archivo:', fileName);
                if (confirm(`¿Está seguro que desea eliminar ${fileName}?`)) {
                    row.style.opacity = '0.5';
                    console.log('Archivo eliminado:', fileName);
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
                alert(`Ir a página ${btn.textContent}`);
            } else if (icon.includes('chevron_left')) {
                console.log('Página anterior');
                alert('Ir a página anterior');
            } else if (icon.includes('chevron_right')) {
                console.log('Página siguiente');
                alert('Ir a página siguiente');
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