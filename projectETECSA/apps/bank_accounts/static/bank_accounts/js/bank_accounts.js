/**
 * Lógica completa para la interfaz de carga y manejo de extractos
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

/* ===== Manejo de Estado, Filtros y Paginación Refactorizado ===== */

// Leer valores actuales del DOM
function getFiltersFromDOM() {
    return {
        bank_account: document.getElementById('bankFilter')?.value || '',
        period_start: document.getElementById('periodStartFilter')?.value || '',
        period_end: document.getElementById('periodEndFilter')?.value || '',
        starting_balance_min: document.getElementById('startingBalanceMin')?.value || '',
        starting_balance_max: document.getElementById('startingBalanceMax')?.value || '',
        ending_balance_min: document.getElementById('endingBalanceMin')?.value || '',
        ending_balance_max: document.getElementById('endingBalanceMax')?.value || ''
    };
}

// Aplicar filtros desencadena una carga en la página 1
function applyFilters() {
    loadPage(1);
}

// Función debounce para evitar múltiples llamadas AJAX al escribir rápido
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Logica visual del Dropdown (Multiselect)
function handleMultiselectChange(checkbox) {
    const menu = checkbox.closest('.dropdown-menu');
    if (!menu) return;

    const allCheckboxes = menu.querySelectorAll('input[type="checkbox"]');
    const isAllOption = checkbox.value === '' || checkbox.value === 'Todos los Bancos';

    if (isAllOption) {
        allCheckboxes.forEach(cb => { if (cb !== checkbox) cb.checked = !checkbox.checked; });
    } else {
        const allOption = Array.from(allCheckboxes).find(cb => cb.value === '' || cb.value === 'Todos los Bancos');
        if (allOption && checkbox.checked) allOption.checked = false;
    }

    const checkedCheckboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
    const checkedValues = Array.from(checkedCheckboxes).map(cb => cb.value).filter(v => v && v !== 'Todos los Bancos');
    
    // Actualizar hidden input
    const hiddenInput = document.getElementById('bankFilter');
    if (hiddenInput) hiddenInput.value = checkedValues.join(',');

    // Actualizar texto del botón
    const btnSpan = document.querySelector('#bankFilterBtn span');
    if (btnSpan) {
        if (checkedValues.length === 0) {
            btnSpan.textContent = 'Todos los Bancos';
            const allOpt = Array.from(allCheckboxes).find(cb => cb.value === '');
            if (allOpt) allOpt.checked = true;
        } else if (checkedValues.length > 2) {
            btnSpan.textContent = `${checkedValues.slice(0, 2).join(', ')} (+${checkedValues.length - 2})`;
        } else {
            btnSpan.textContent = checkedValues.join(', ');
        }
    }

    applyFilters();
}

// Resetear Filtros
function resetFilters() {
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    
    const bankMenu = document.getElementById('bankFilterMenu');
    if (bankMenu) {
        bankMenu.querySelectorAll('input[type="checkbox"]').forEach((cb, idx) => cb.checked = (idx === 0));
    }
    const bankBtnSpan = document.querySelector('#bankFilterBtn span');
    if (bankBtnSpan) bankBtnSpan.textContent = 'Todos los Bancos';

    showNotification('Filtros reiniciados', 'info');
    loadPage(1);
}

// Toggle de panel de filtros
function setupFilterToggle() {
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const filterContainer = document.getElementById('filterContainer');

    if (toggleBtn && filterContainer) {
        toggleBtn.addEventListener('click', function() {
            const isHidden = filterContainer.style.display === 'none';
            filterContainer.style.display = isHidden ? 'block' : 'none';
            this.querySelector('.expand-icon').textContent = isHidden ? 'expand_less' : 'expand_more';
            document.getElementById('toggleFiltersText').textContent = isHidden ? 'Ocultar Filtros' : 'Mostrar Filtros';
        });
    }
}

function initFilterEvents() {
    const debouncedApply = debounce(applyFilters, 500);

    // Inputs de texto/fecha/número usan debounce
    document.querySelectorAll('#periodStartFilter, #periodEndFilter, #startingBalanceMin, #startingBalanceMax, #endingBalanceMin, #endingBalanceMax').forEach(input => {
        input.addEventListener('input', debouncedApply);
    });

    // Filtro de banco (detectado por el hidden input o los checkboxes)
    const bankFilterMenu = document.getElementById('bankFilterMenu');
    if (bankFilterMenu) {
        bankFilterMenu.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                handleMultiselectChange(e.target);
            }
        });
    }
}

// Carga principal por AJAX
function loadPage(pageNumber) {
    const filters = getFiltersFromDOM();
    const urlParams = new URLSearchParams();
    
    urlParams.set('page', pageNumber);
    for (const [key, value] of Object.entries(filters)) {
        if (value) urlParams.set(key, value);
    }

    const apiUrl = `/bank-accounts/api/pagination/?${urlParams.toString()}`;

    // Mostrar estado de carga en la tabla
    const tbody = document.querySelector('.upload-history-table tbody');
    if (tbody) tbody.style.opacity = '0.5';

    fetch(apiUrl, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'error') throw new Error(data.message);
        
        updateTable(data.statements);
        updatePagination(data.pagination);
        
        // Sincronizar URL del navegador sin recargar
        window.history.pushState({ page: pageNumber }, '', `?${urlParams.toString()}`);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error al cargar los datos', 'error');
    })
    .finally(() => {
        if (tbody) tbody.style.opacity = '1';
    });
}

/* ===== INICIALIZACIÓN UNIFICADA ===== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Subida de archivos
    if (typeof initializeFileUpload === 'function') initializeFileUpload();
    
    // 2. Historial
    if (typeof initializeHistoryActions === 'function') initializeHistoryActions();
    
    // 3. Restaurar Filtros desde URL ANTES de cargar
    restoreFiltersFromURL();
    setupFilterToggle();
    loadFilterOptions(); // Rellena dropdown usando la info restaurada
    initFilterEvents();

    // 4. Paginación (delegation)
    const paginationFooter = document.querySelector('.pagination-footer');
    if (paginationFooter) {
        paginationFooter.addEventListener('click', (e) => {
            const btn = e.target.closest('.pagination-btn');
            if (!btn || btn.disabled || btn.hasAttribute('aria-disabled')) return;
            e.preventDefault();
            const page = btn.getAttribute('data-page');
            if (page) loadPage(parseInt(page));
        });
    }

    // 5. Dropdowns (SOLUCIÓN AL CIERRE ACCIDENTAL)
    document.querySelectorAll('.dropdown-multiselect button').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            btn.nextElementSibling.classList.toggle('show');
        });
    });

    // Solo cierra el menú si el clic fue AFUERA del componente de filtro
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-multiselect')) {
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(m => {
                m.classList.remove('show');
            });
        }
    });

    // 6. Navegación en el historial del navegador (Atrás/Adelante)
    window.addEventListener('popstate', () => {
        window.location.reload();
    });

    // NO cargamos datos por AJAX aquí porque Django ya renderiza la tabla filtrada 
    // desde el servidor basándose en la URL. Esto ahorra una doble petición AJAX.
});

function getFilterValues(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return '';

    const checkedCheckboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
    const specialValues = ['', 'Todos los Bancos', 'Todos', 'Todas'];
    
    const values = Array.from(checkedCheckboxes)
        .map(cb => cb.value)
        .filter(v => v && !specialValues.includes(v));

    return values.join(',');
}

function loadFilterOptions() {
    return fetch('/bank-accounts/api/filters/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            populateFilterOptions(data.filters);
        }
    })
    .catch(error => {
        console.error('Error loading filter options:', error);
    });
}

// --- NUEVO: Rellena inputs DESDE la URL al recargar ---
function restoreFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const inputs = {
        'period_start': 'periodStartFilter',
        'period_end': 'periodEndFilter',
        'starting_balance_min': 'startingBalanceMin',
        'starting_balance_max': 'startingBalanceMax',
        'ending_balance_min': 'endingBalanceMin',
        'ending_balance_max': 'endingBalanceMax'
    };

    let hasFilters = false;

    // Restaurar inputs
    for (const [urlKey, domId] of Object.entries(inputs)) {
        const val = urlParams.get(urlKey);
        if (val) {
            const el = document.getElementById(domId);
            if (el) {
                el.value = val;
                hasFilters = true;
            }
        }
    }

    // Restaurar banco
    const bankVal = urlParams.get('bank_account');
    if (bankVal) {
        const bankInput = document.getElementById('bankFilter');
        if (bankInput) {
            bankInput.value = bankVal;
            hasFilters = true;
        }
    }

    // Mantener panel abierto si hay filtros
    if (hasFilters) {
        const filterContainer = document.getElementById('filterContainer');
        if (filterContainer) {
            filterContainer.style.display = 'block';
            const toggleText = document.getElementById('toggleFiltersText');
            if (toggleText) toggleText.textContent = 'Ocultar Filtros';
            const expandIcon = document.querySelector('#toggleFiltersBtn .expand-icon');
            if (expandIcon) expandIcon.textContent = 'expand_less';
        }
    }
}

// --- ACTUALIZADO: Rellena las opciones del banco respetando la URL ---
function populateFilterOptions(filters) {
    const populateMenu = (menuId, options) => {
        const menu = document.getElementById(menuId);
        if (!menu) return;
        
        const hiddenInput = document.getElementById('bankFilter');
        const selectedValues = hiddenInput && hiddenInput.value ? hiddenInput.value.split(',') : [];

        menu.innerHTML = options.map((opt, index) => {
            const isChecked = selectedValues.length > 0 
                ? selectedValues.includes(opt.value) 
                : (index === 0);

            return `
            <li class="dropdown-item">
                <input type="checkbox" value="${opt.value}" id="chk-${menuId}-${opt.value}" class="form-check-input me-2" ${isChecked ? 'checked' : ''}>
                <label class="form-check-label flex-grow-1 py-1 mb-0" for="chk-${menuId}-${opt.value}" style="cursor: pointer;">${opt.label}</label>
            </li>
        `}).join('');
        
        // Actualizar el texto del botón
        const btnSpan = document.querySelector('#bankFilterBtn span');
        if (btnSpan) {
            if (selectedValues.length === 0) {
                btnSpan.textContent = 'Todos los Bancos';
            } else if (selectedValues.length > 2) {
                btnSpan.textContent = `${selectedValues.slice(0, 2).join(', ')} (+${selectedValues.length - 2})`;
            } else {
                btnSpan.textContent = selectedValues.join(', ');
            }
        }

        // Asignar eventos
        menu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                handleMultiselectChange(this);
            });
        });
    };
    
    if (filters.banks) {
        populateMenu('bankFilterMenu', filters.banks);
    }
}

function initDropdowns() {
    const buttons = document.querySelectorAll('.dropdown-multiselect button');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.closest('.dropdown-multiselect');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(openMenu => {
                if (openMenu !== menu) {
                    openMenu.classList.remove('show');
                }
            });
            
            menu.classList.toggle('show');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-multiselect')) {
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
});
}

 /**
 * Configura la zona de carga (Drag & Drop + Click)
 */
function initializeFileUpload() {
    const dropZone = document.querySelector('.upload-zone');
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectFilesBtn');

    if (!dropZone || !fileInput) return;

    // Evitar comportamientos por defecto del navegador
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, false);
        document.body.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    // Efectos visuales al arrastrar
    dropZone.addEventListener('dragover', () => {
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.backgroundColor = 'rgba(211, 228, 255, 0.1)';
    });
    dropZone.addEventListener('dragleave drop', () => {
        dropZone.style.borderColor = 'var(--outline-variant)';
        dropZone.style.backgroundColor = '';
    });

    // Manejo de eventos
    dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
    dropZone.addEventListener('click', e => {
        if (e.target === fileInput || e.target.closest('#selectFilesBtn')) return;
        fileInput.click();
    });
    selectBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
    fileInput.addEventListener('change', e => handleFiles(e.target.files));
}

/**
 * Función principal: Validación y envío al servidor
 */
function handleFiles(files) {
    if (!files || files.length === 0) return;

    const accountSelect = document.getElementById('bankAccountSelect');
    const accountId = accountSelect?.value || '';

    if (!accountSelect) {
        displayNotification('Por favor, implemente un selector de cuenta bancaria en el template para asociar el extracto.', 'warning');
        return;
    }
    if (!accountId) {
        displayNotification('Seleccione una cuenta bancaria antes de subir el extracto.', 'warning');
        return;
    }

    const selectedFiles = Array.from(files);
    if (selectedFiles.length > 1) {
        displayNotification('Solo puede subir un archivo a la vez.', 'warning');
        return;
    }

    const file = selectedFiles[0];
    const extension = file.name.split('.').pop().toLowerCase();
    const allowed = ['txt'];

    if (!allowed.includes(extension)) {
        displayNotification(`Formato inválido para: ${file.name}. Solo se permiten archivos .TXT`, 'danger');
        return;
    }

    uploadFile(file, accountId).then(reload => {
        document.getElementById('fileInput').value = '';
        if (reload) {
            window.location.reload();
        }
    });
}

/**
 * Muestra notificaciones flotantes usando Bootstrap-style alerts
 */
function displayNotification(message, type = 'info') {
    const cleanMsg = cleanMessage(message);
    const alertType = {
        'success': 'alert-success',
        'warning': 'alert-warning',
        'danger': 'alert-danger',
        'info': 'alert-info'
    }[type] || 'alert-info';

    document.querySelectorAll('.bank-alert').forEach(el => el.remove());

    const alert = document.createElement('div');
    alert.className = `bank-alert alert ${alertType} alert-dismissible fade show`;
    alert.innerHTML = `
        ${cleanMsg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);

    const timeout = type === 'danger' ? 6000 : 5000;
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, timeout);

    // Actualizar notificaciones del servidor para la campana
    if (type === 'success' && typeof window.reloadNotifications === 'function') {
        setTimeout(() => window.reloadNotifications(), 500);
    }
}

/**
 * Envía un archivo individual al backend de Django
 */
function getCurrentPageNumber() {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page') || '1', 10);
    return Number.isNaN(page) ? 1 : page;
}

function getCurrentTableRowCount() {
    const tbody = document.querySelector('.upload-history-table tbody');
    if (!tbody) return 0;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    return rows.filter(row => !row.querySelector('td[colspan="7"]')).length;
}

function shouldReloadAfterUpload() {
    const currentPage = getCurrentPageNumber();
    const currentRows = getCurrentTableRowCount();
    return currentPage !== 1 || currentRows >= 5;
}

function updateLastProcessing(createdAtFormatted) {
    const container = document.getElementById('lastProcessingTime');
    if (!container) return;
    
    // createdAtFormatted viene en formato "dd/mm/YYYY HH:MM"
    const parts = createdAtFormatted.split(' ');
    if (parts.length >= 2) {
        const time = parts[1]; // HH:MM
        const dateParts = parts[0].split('/');
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthName = monthNames[month - 1];
        
        const dateStr = `${day} ${monthName} ${year}`;
        
        container.innerHTML = `<span class="time">${time}</span><span class="date">${dateStr}</span>`;
    }
}

function uploadFile(file, accountId) {
    const btn = document.getElementById('selectFilesBtn');
    const originalBtnContent = btn.innerHTML;
    
    // UI Loading
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">sync</span> Procesando...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_id', accountId);

    const uploadUrl = '/bank-accounts/api/upload-statement/';
    return fetch(uploadUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRFToken': getCSRFToken() },
        body: formData
    })
    .then(async res => {
        if (!res.ok) {
            const errorText = await res.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || `Error HTTP ${res.status}`);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    throw new Error(`Error HTTP ${res.status}: ${errorText.substring(0, 100)}`);
                }
                throw e;
            }
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            const reload = shouldReloadAfterUpload();
            if (reload) {
                displayNotification('Extracto cargado. Se actualizará la lista para mantener la paginación.', 'success');
            } else {
                addHistoryRow(data.data);
                displayNotification(data.message, 'success');
            }
            // Actualizar último procesamiento en tiempo real
            if (data.data && data.data.created_at) {
                updateLastProcessing(data.data.created_at);
            }
            return reload;
        } else {
            displayNotification(`Error en ${file.name}: ${data.error}`, 'danger');
            return false;
        }
    })
    .catch(err => {
        console.error(err);
        const cleanErr = cleanMessage(err.message);
        displayNotification(`Error de conexión con el servidor: ${cleanErr}`, 'danger');
        return false;
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = originalBtnContent;
    });
}

/**
 * Parsea una fecha ISO (YYYY-MM-DD) sin problemas de zona horaria
 */
function parseDateString(dateStr) {
    if (!dateStr) return null;
    // Parsear manualmente para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Parsea un datetime ISO sin problemas de zona horaria
 */
function parseDateTimeString(isoStr) {
    if (!isoStr) return null;
    const [dateStr, timeStr] = isoStr.split('T');
    const [year, month, day] = dateStr.split('-');
    let date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (timeStr) {
        const [hours, minutes, seconds] = timeStr.replace('Z', '').split(':');
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        if (seconds) date.setSeconds(parseInt(seconds));
    }
    return date;
}

/**
 * Añade fila a la tabla de historial sin recargar
 */
function formatFileSize(bytes) {
    if (bytes == null || Number.isNaN(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }

    return `${size.toFixed(1).replace(/\.0$/, '')} ${units[index]}`;
}

function addHistoryRow(data) {
    const tbody = document.querySelector('.upload-history-table tbody');
    if (!tbody) return;

    const emptyRow = tbody.querySelector('tr td[colspan="7"]');
    if (emptyRow) {
        tbody.innerHTML = '';
    }
    
    const tr = document.createElement('tr');
    
    // Las fechas ya vienen formateadas desde el servidor en el mismo formato que Django
    const createdAtStr = data.created_at;
    const periodStartStr = data.period_start;
    const periodEndStr = data.period_end;
    const fileSizeLabel = data.file_size ? ` · ${formatFileSize(data.file_size)}` : '';
    
    tr.innerHTML = `
        <td>
            <div class="file-item">
                ${getFileIcon(data.file_extension || 'txt')}
                <div class="file-info">
                    <p class="file-name">${data.file}</p>
                    <p class="file-size">${data.tx_count} transacciones${fileSizeLabel}</p>
                </div>
            </div>
        </td>
        <td class="bank-name">${data.bank_name}</td>
        <td class="upload-date">${createdAtStr}</td>
        <td class="upload-period">${periodStartStr} - ${periodEndStr}</td>
        <td class="text-end amount">${formatCurrency(data.starting_balance || 0)}</td>
        <td class="text-end amount">${formatCurrency(data.ending_balance || 0)}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn btn-view" title="Ver" data-statement-file="${data.file}" onclick="openStatementModal(this)"><span class="material-symbols-outlined">visibility</span></button>
                <button class="action-btn btn-download" title="Descargar" data-statement-file="${data.file}" onclick="downloadStatement(this)"><span class="material-symbols-outlined">download</span></button>
            </div>
        </td>
    `;
    
    // Animación de entrada
    tr.style.opacity = '0';
    tbody.prepend(tr);
    setTimeout(() => { tr.style.transition = 'opacity 0.5s'; tr.style.opacity = '1'; }, 10);
    
    // Actualizar el contador de paginación
    updatePaginationInfo();
    
    initializeHistoryActions(); // Reinicializar listeners para nuevos botones
}

/**
 * Actualiza el texto de paginación "Mostrando X - Y de Z extractos cargados"
 */
function updatePaginationInfo() {
    const paginationInfo = document.querySelector('.pagination-info');
    if (!paginationInfo) return;
    
    // Extraer valores actuales del texto (Mostrando 1 - 2 de 5 extractos cargados)
    const match = paginationInfo.textContent.match(/Mostrando (\d+) - (\d+) de (\d+)/);
    if (!match) return;
    
    let startIndex = parseInt(match[1]);
    let endIndex = parseInt(match[2]);
    let totalStatements = parseInt(match[3]);
    
    // Incrementar total
    totalStatements += 1;
    
    // Si estamos en página 1 y el end_index es menor a 5, incrementar end_index
    const currentPage = getCurrentPageNumber();
    if (currentPage === 1 && endIndex < 5) {
        endIndex += 1;
    }
    
    // Actualizar el texto
    paginationInfo.textContent = `Mostrando ${startIndex} - ${endIndex} de ${totalStatements} extractos cargados`;
}

/**
 * Utilidad: Obtener token CSRF de Django
 */
function getCSRFToken() {
    const name = 'csrftoken=';
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.indexOf(name) === 0) return c.substring(name.length);
    }
    return '';
}

/**
 * Manejo de botones de acción en la tabla
 */
function initializeHistoryActions() {
    document.querySelectorAll('.upload-history-table .action-btn').forEach(btn => {
        // Los botones ya tienen eventos onclick en el HTML
        // Este método se mantiene para compatibilidad futura
    });
}

function updateTable(statements) {
    const tbody = document.querySelector('.upload-history-table tbody');
    if (!tbody) return;
    
    if (statements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted">No se encontraron estados de cuenta cargados.</td></tr>';
        return;
    }
    
    tbody.innerHTML = statements.map(statement => `
        <tr>
            <td>
                <div class="file-item">
                    ${getFileIcon(statement.file_extension)}
                    <div class="file-info">
                        <p class="file-name">${statement.file_name}</p>
                        <p class="file-size">
                            ${statement.entry_count} transacciones
                            ${statement.file_size ? '· ' + formatFileSize(statement.file_size) : ''}
                        </p>
                    </div>
                </div>
            </td>
            <td class="bank-name">${statement.bank_account_name}</td>
            <td class="upload-date">${statement.created_at}</td>
            <td class="upload-period">${statement.period_start} - ${statement.period_end}</td>
            <td class="text-end amount">$${formatNumber(statement.starting_balance)}</td>
            <td class="text-end amount">$${formatNumber(statement.ending_balance)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-view" title="Ver" data-statement-file="${statement.file_name}" onclick="openStatementModal(this)">
                        <span class="material-symbols-outlined">visibility</span>
                    </button>
                    <button class="action-btn btn-download" title="Descargar" data-statement-file="${statement.file_name}" onclick="downloadStatement(this)">
                        <span class="material-symbols-outlined">download</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updatePagination(pagination) {
    const paginationControls = document.querySelector('.pagination-controls');
    const paginationInfo = document.querySelector('.pagination-info');
    
    if (!paginationControls || !paginationInfo) return;
    
    // Update info text
    paginationInfo.textContent = `Mostrando ${pagination.start_index} - ${pagination.end_index} de ${pagination.total_statements} extractos cargados`;
    
    // Update pagination buttons
    let buttonsHtml = '';
    
    // Previous button
    if (pagination.has_previous) {
        buttonsHtml += `<button class="pagination-btn" data-page="${pagination.previous_page_number}" title="Página anterior">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
    } else {
        buttonsHtml += `<span class="pagination-btn" title="Página anterior" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_left</span>
        </span>`;
    }
    
    // Page numbers
    pagination.page_range.forEach(num => {
        const isActive = num === pagination.current_page;
        buttonsHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${num}">${num}</button>`;
    });
    
    // Next button
    if (pagination.has_next) {
        buttonsHtml += `<button class="pagination-btn" data-page="${pagination.next_page_number}" title="Página siguiente">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>`;
    } else {
        buttonsHtml += `<span class="pagination-btn" title="Página siguiente" aria-disabled="true" tabindex="-1" style="pointer-events: none; opacity: 0.5;">
            <span class="material-symbols-outlined">chevron_right</span>
        </span>`;
    }
    
    paginationControls.innerHTML = buttonsHtml;
}

function getFileIcon(extension) {
    const ext = extension.toLowerCase();
    let iconClass = 'txt';
    let iconName = 'text_snippet';
    
    if (ext === 'pdf') {
        iconClass = 'pdf';
        iconName = 'picture_as_pdf';
    } else if (ext === 'csv') {
        iconClass = 'csv';
        iconName = 'csv';
    } else if (ext === 'xlsx' || ext === 'xls') {
        iconClass = 'xlsx';
        iconName = 'table_chart';
    }
    
    return `<div class="file-icon ${iconClass}">
        <span class="material-symbols-outlined">${iconName}</span>
    </div>`;
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatNumber(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Abre el modal y carga el estado de cuenta completo
 */
function openStatementModal(button) {
    const statementFile = button.getAttribute('data-statement-file');
    const modalBody = document.getElementById('statementModalBody');
    
    console.log('DEBUG openStatementModal - data-statement-file:', statementFile);
    
    if (!statementFile) {
        displayNotification('Error: No se pudo obtener el archivo del estado de cuenta', 'danger');
        return;
    }

    // Mostrar spinner de carga
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    
    // Abrir el modal
    const modal = new bootstrap.Modal(document.getElementById('statementModal'));
    modal.show();
    
    // Cargar datos del estado de cuenta
    const fetchUrl = `./api/bank-statements/${encodeURIComponent(statementFile)}/`;
    console.log('DEBUG openStatementModal - fetch URL:', fetchUrl);
    
    fetch(fetchUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('DEBUG openStatementModal - response status:', response.status);
        if (!response.ok) throw new Error('Error al cargar el estado');
        return response.json();
    })
    .then(data => {
        console.log('DEBUG openStatementModal - data:', data);
        // Guardar el nombre de archivo para descargar después
        window.currentStatementFile = statementFile;
        renderStatementContent(data, modalBody);
    })
    .catch(error => {
        console.error('Error:', error);
        const cleanError = cleanMessage(error.message);
        modalBody.innerHTML = `<div class="alert alert-danger">Error al cargar el estado de cuenta: ${cleanError}</div>`;
    });
}

/**
 * Renderiza el contenido del estado de cuenta en el modal
 */
function renderStatementContent(data, container) {
    const html = `
        <div class="statement-document">
            <div class="statement-header mb-4">
                <h3 class="mb-3">${data.bank_account_name}</h3>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="statement-info-item">
                            <label class="text-muted small">Número de Cuenta</label>
                            <p class="fw-bold">${data.bank_account_code}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="statement-info-item">
                            <label class="text-muted small">Fecha del Extracto</label>
                            <p class="fw-bold">${data.statement_date}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="statement-info-item">
                            <label class="text-muted small">Periodo</label>
                            <p class="fw-bold">${data.period_start} - ${data.period_end}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="statement-info-item">
                            <label class="text-muted small">Total de Transacciones</label>
                            <p class="fw-bold">${data.entry_count}</p>
                        </div>
                    </div>
                </div>
            </div>           

            <div class="statement-summary mb-4">
                <h5 class="mb-3">Resumen Financiero</h5>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="summary-card">
                            <span class="summary-label" style="font-weight: bold; font-size: 1.0rem;">Saldo Inicial</span>
                            <p class="summary-value text-primary text-end">${formatCurrency(data.starting_balance)}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="summary-card">
                            <span class="summary-label" style="font-weight: bold; font-size: 1.0rem;">Saldo Final</span>
                            <p class="summary-value text-success text-end">${formatCurrency(data.ending_balance)}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="summary-card">
                            <span class="summary-label" style="font-weight: bold; font-size: 1.0rem;">Saldo de Sobregiro</span>
                            <p class="summary-value text-end">${formatCurrency(data.overdraft_balance)}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="summary-card">
                            <span class="summary-label" style="font-weight: bold; font-size: 1.0rem;">Saldo Reservado</span>
                            <p class="summary-value text-warning text-end">${formatCurrency(data.reserved_balance)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="statement-transactions">
                <h5 class="mb-3">Transacciones (${data.entry_count})</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead class="table-light">
                            <tr>                                
                                <th>Ref. corriente</th>
                                <th>Ref. original</th>
                                <th>Descripción</th>
                                <th class="text-end">Monto</th>
                                <th>Db/Cr</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.transactions.map(tx => `
                                <tr>                                   
                                    <td class="font-monospace small">${tx.current_reference || ''}</td>
                                    <td class="font-monospace small">${tx.original_reference || ''}</td>
                                    <td>${tx.description}</td>
                                    <td class="text-end ${tx.amount >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(tx.amount)}</td>
                                    <td>${tx.entry_type || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Descarga el estado de cuenta desde la tabla
 */
function downloadStatement(button) {
    const statementFile = button.getAttribute('data-statement-file');
    
    console.log('DEBUG downloadStatement - data-statement-file:', statementFile);
    
    if (!statementFile) {
        displayNotification('Error: No se pudo obtener el archivo del estado de cuenta', 'danger');
        return;
    }

    const downloadUrl = `./api/bank-statements/${encodeURIComponent(statementFile)}/download/`;
    console.log('DEBUG downloadStatement - download URL:', downloadUrl);
    window.location.href = downloadUrl;
}

/**
 * Descarga el estado de cuenta desde el modal
 */
function downloadStatementFromModal() {
    if (!window.currentStatementFile) {
        displayNotification('Error: No hay un estado de cuenta cargado', 'danger');
        return;
    }
    
    window.location.href = `./api/bank-statements/${encodeURIComponent(window.currentStatementFile)}/download/`;
}

/**
 * Formatea un número como moneda
 */
function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00 CUP';
    return new Intl.NumberFormat('es-CU', {
        style: 'currency',
        currency: 'CUP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// ===== Notificaciones =====
function showNotification(message, type = 'info') {
    const cleanMsg = cleanMessage(message);
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    // Remover notificaciones anteriores
    document.querySelectorAll('.bank-alert').forEach(el => el.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `bank-alert alert ${alertClass} alert-dismissible fade show`;
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
}