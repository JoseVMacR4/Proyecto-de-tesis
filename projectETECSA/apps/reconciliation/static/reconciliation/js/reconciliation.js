/*
   ETECSA Finanzas - Reconciliation JavaScript
   Funcionalidad para gestionar transacciones bancarias
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
    initializeUserPermissions();
    initializeReconciliation();
});

let savedSelectedIds = [];
let pendingRestore = false;

function getStorageKey(key) {
    const userData = document.getElementById('userPermissionsData');
    const userId = userData ? userData.dataset.userId : 'anonymous';
    return `reconciliation_${key}_${userId}`;
}

function tryRestoreState() {
    const userData = document.getElementById('userPermissionsData');
    const currentUserId = userData ? userData.dataset.userId : null;
    const savedUserId = sessionStorage.getItem(getStorageKey('UserId'));
    
    if (!savedUserId || savedUserId !== currentUserId) {
        sessionStorage.removeItem(getStorageKey('State'));
        sessionStorage.removeItem(getStorageKey('RestorePending'));
        if (currentUserId) {
            sessionStorage.setItem(getStorageKey('UserId'), currentUserId);
        }
        return false;
    }
    
    const storageKey = getStorageKey('State');
    const savedState = sessionStorage.getItem(storageKey);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state && state.filters) {
                currentFilters = state.filters;
                savedSelectedIds = state.selectedIds || [];
                pendingRestore = true;
                sessionStorage.setItem(getStorageKey('RestorePending'), 'true');
                return true;
            }
        } catch (e) {
            console.error('Error restoring state:', e);
            sessionStorage.removeItem(storageKey);
        }
    }
    return false;
}

function finishStateRestore() {
    if (pendingRestore) {
        pendingRestore = false;
        sessionStorage.removeItem(getStorageKey('State'));
        sessionStorage.removeItem(getStorageKey('RestorePending'));
    }
}

function applyFiltersFromState() {
    if (currentFilters.date_from) {
        document.getElementById('dateFrom').value = currentFilters.date_from;
    }
    if (currentFilters.date_to) {
        document.getElementById('dateTo').value = currentFilters.date_to;
    }
    if (currentFilters.reference) {
        document.getElementById('referenceFilter').value = currentFilters.reference;
    }
    if (currentFilters.name) {
        document.getElementById('nameFilter').value = currentFilters.name;
    }
    if (currentFilters.amount_min) {
        document.getElementById('amountMinFilter').value = currentFilters.amount_min;
    }
    if (currentFilters.amount_max) {
        document.getElementById('amountMaxFilter').value = currentFilters.amount_max;
    }
    
    const filterContainer = document.getElementById('filterContainer');
    const toggleText = document.getElementById('toggleFiltersText');
    const expandIcon = document.querySelector('.expand-icon');
    
    if (currentFilters.filterPanelOpen && filterContainer) {
        filterContainer.style.display = 'block';
        if (toggleText) toggleText.textContent = 'Ocultar Filtros';
        if (expandIcon) expandIcon.textContent = 'expand_less';
    }
    
    if (currentFilters.bank) {
        restoreMultiselectDropdown('bankFilterMenu', currentFilters.bank);
    }
    if (currentFilters.status) {
        restoreMultiselectDropdown('statusFilterMenu', currentFilters.status);
    }
    if (currentFilters.office_code) {
        restoreMultiselectDropdown('officeFilterMenu', currentFilters.office_code);
    }
    if (currentFilters.entry_type) {
        restoreMultiselectDropdown('entryTypeFilterMenu', currentFilters.entry_type);
    }
    if (currentFilters.operation_type) {
        restoreMultiselectDropdown('operationTypeFilterMenu', currentFilters.operation_type);
    }
    if (currentFilters.currency) {
        restoreMultiselectDropdown('currencyFilterMenu', currentFilters.currency);
    }
}

function restoreMultiselectDropdown(menuId, values) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    
    const valueArray = values.split(',').filter(v => v);
    
    menu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    valueArray.forEach(val => {
        const checkbox = Array.from(menu.querySelectorAll('input[type="checkbox"]'))
            .find(cb => cb.value === val);
        if (checkbox) checkbox.checked = true;
    });
    
    updateDropdownButtonText(menu);
}

function restoreSelectedCheckboxes() {
    if (savedSelectedIds.length > 0) {
        savedSelectedIds.forEach(id => {
            const checkbox = document.querySelector(`input[name="row-select"][data-transaction-id="${id}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        updateMasterCheckbox();
        savedSelectedIds = [];
    }
    updateBulkActionsVisibility();
}

function initializeUserPermissions() {
    const dataElement = document.getElementById('userPermissionsData');
    window.userPermissions = {
        can_reconcile: dataElement?.dataset?.canReconcile === 'true'
    };
}

// ===== Inicialización General =====
function initializeReconciliation() {
    const restored = tryRestoreState();
    
    initializeDropdowns();
    setupFilterListeners();
    setupTableListeners();
    setupPaginationListeners();
    setupJumpListeners();
    setupFilterToggle();
    setupExportListener();

    loadFilterOptions().then(() => {
        if (pendingRestore) {
            setTimeout(() => {
                applyFiltersFromState();
                setTimeout(() => restoreSelectedCheckboxes(), 100);
            }, 100);
        }
        
        console.log('Loading transactions with filters:', currentFilters);
        loadTransactions(currentFilters);
        
        if (pendingRestore) {
            setTimeout(() => finishStateRestore(), 500);
        }
    })
    .catch(error => {
        console.error('Error loading:', error);
    });
    
    window.addEventListener('beforeunload', () => {
        const userData = document.getElementById('userPermissionsData');
        const currentUserId = userData ? userData.dataset.userId : null;
        
        if (currentUserId) {
            sessionStorage.setItem(getStorageKey('UserId'), currentUserId);
        }
        sessionStorage.setItem(getStorageKey('State'), JSON.stringify({
            filters: currentFilters,
            selectedIds: getSelectedTransactionIds()
        }));
    });
}

function initializeDropdowns() {
    console.log('Initializing dropdowns...');
    
    const buttons = document.querySelectorAll('.dropdown-multiselect button');
    console.log('Found buttons:', buttons.length);
    
    buttons.forEach(button => {
        console.log('Button found:', button.id);
        
        // Agregar handler manual
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdown = this.closest('.dropdown-multiselect');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Cerrar otros dropdowns
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(openMenu => {
                if (openMenu !== menu) {
                    openMenu.classList.remove('show');
                }
            });
            
            // Toggle este dropdown
            menu.classList.toggle('show');
        };
        
        console.log('Dropdown initialized for:', button.id);
    });
    
    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-multiselect')) {
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
    
    // Agregar event listeners a los checkboxes de los menús
    document.querySelectorAll('.dropdown-multiselect .dropdown-menu').forEach(menu => {
        menu.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
                handleDropdownCheckboxChange(e.target);
            }
        });
    });
}

// ===== Filtros =====
function setupFilterListeners() {
    // Listeners para inputs simples (texto, date, number)
    const filterInputs = document.querySelectorAll('.filter-input:not([type="hidden"])');
    filterInputs.forEach(input => {
        input.addEventListener('change', applyFilters);
        input.addEventListener('input', debounce(applyFilters, 500));
    });

    // Event delegation global para TODOS los checkboxes dentro de dropdowns
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('.dropdown-menu')) {
            console.log('Checkbox changed:', e.target.value, 'Checked:', e.target.checked);
            handleMultiselectChange(e.target);
        }
    });

    // Conectar listeners a status filter (que ya existe en HTML)
    const statusCheckboxes = document.querySelectorAll('#statusFilterMenu input[type="checkbox"]');
    statusCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleMultiselectChange(this);
        });
    });
}

function handleMultiselectChange(checkbox) {
    // Encontrar el menú padre
    const menu = checkbox.closest('.dropdown-menu');
    if (!menu) {
        console.warn('No menu found for checkbox');
        return;
    }

    const menuId = menu.id;
    console.log('Handling change for menu:', menuId);

    // Encontrar el botón y hidden input correspondientes
    const btnId = menuId.replace('Menu', 'Btn');
    const hiddenInputId = menuId.replace('FilterMenu', 'Filter');
    
    const btn = document.getElementById(btnId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (!btn || !hiddenInput) {
        console.warn(`No button or input found for menu ${menuId}`);
        return;
    }

    // Obtener todos los checkboxes del menu
    const allCheckboxes = menu.querySelectorAll('input[type="checkbox"]');
    const checkedCheckboxes = menu.querySelectorAll('input[type="checkbox"]:checked');

    // Construir el texto a mostrar
    const checkedValues = Array.from(checkedCheckboxes).map(cb => cb.value).filter(v => v);
    const displayText = Array.from(checkedCheckboxes)
        .map(cb => {
            const label = cb.closest('label') || cb.nextElementSibling;
            return label ? label.textContent.trim() : cb.value;
        })
        .filter(text => text);

    // Actualizar hidden input
    hiddenInput.value = checkedValues.join(',');

    // Actualizar texto del botón
    const textSpan = btn.querySelector('span');
    if (textSpan && displayText.length > 0) {
        if (displayText.length > 2) {
            textSpan.textContent = displayText.slice(0, 2).join(', ') + ` (+${displayText.length - 2})`;
        } else {
            textSpan.textContent = displayText.join(', ');
        }
    }

    // Disparar búsqueda
    applyFilters();
}

function getFilterValues(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return '';

    const checkedCheckboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
    const specialValues = ['', 'Todos los Bancos', 'Todos los Estados', 'Todas las Oficinas', 
                           'Todos los Tipos', 'Todas las Monedas', 'Todos', 'Todas'];
    
    const values = Array.from(checkedCheckboxes)
        .map(cb => cb.value)
        .filter(v => v && !specialValues.includes(v));

    return values.join(',');
}

let currentFilters = { page: 1 };

function applyFilters() {
    const bankValue = getFilterValues('bankFilterMenu');
    const statusValue = getFilterValues('statusFilterMenu');
    
    const amountMinInput = document.getElementById('amountMinFilter');
    const amountMaxInput = document.getElementById('amountMaxFilter');
    
    let amountMin = amountMinInput?.value || '';
    let amountMax = amountMaxInput?.value || '';
    
    if (amountMin && parseFloat(amountMin) < 0) {
        amountMinInput.value = '';
        amountMin = '';
    }
    if (amountMax && parseFloat(amountMax) < 0) {
        amountMaxInput.value = '';
        amountMax = '';
    }
    
    currentFilters = {
        date_from: document.getElementById('dateFrom')?.value || '',
        date_to: document.getElementById('dateTo')?.value || '',
        bank: bankValue,
        status: statusValue,
        reference: document.getElementById('referenceFilter')?.value || '',
        name: document.getElementById('nameFilter')?.value || '',
        office_code: getFilterValues('officeFilterMenu'),
        entry_type: getFilterValues('entryTypeFilterMenu'),
        operation_type: getFilterValues('operationTypeFilterMenu'),
        amount_min: amountMin,
        amount_max: amountMax,
        currency: getFilterValues('currencyFilterMenu'),
        filterPanelOpen: document.getElementById('filterContainer')?.style.display !== 'none',
        page: pendingRestore ? (currentFilters.page || 1) : 1
    };
    
    if (pendingRestore) {
        pendingRestore = false;
    }
    
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
    const populateMenu = (menuId, options) => {
        const menu = document.getElementById(menuId);
        if (!menu || !options) return;

        menu.innerHTML = '';
        
        options.forEach((option, index) => {
            const li = document.createElement('li');
            li.className = 'dropdown-item';
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.padding = '0.375rem 0.75rem';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.style.marginRight = '0.5rem';
            checkbox.style.marginTop = '0';
            checkbox.style.width = '16px';
            checkbox.style.height = '16px';
            checkbox.value = option.value;
            checkbox.id = `chk-${menuId}-${index}`;
            
            // Marcar por defecto la opción "Todos" (valor vacío)
            if (option.value === '' || option.value === 'Todos' || option.value === 'Todas') {
                checkbox.checked = true;
            }
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = checkbox.id;
            label.style.marginBottom = '0';
            label.style.cursor = 'pointer';
            label.style.width = '100%';
            label.textContent = option.label || option.value;
            
            li.appendChild(checkbox);
            li.appendChild(label);
            menu.appendChild(li);
        });
    };

    populateMenu('bankFilterMenu', filters.banks);
    populateMenu('entryTypeFilterMenu', filters.entry_types);
    populateMenu('currencyFilterMenu', filters.currencies);
    populateMenu('officeFilterMenu', filters.offices);
    populateMenu('operationTypeFilterMenu', filters.operation_types);

    // Forzar re-inicialización de dropdowns DESPUÉS de populate
    setTimeout(() => {
        forceReinitializeDropdowns();
    }, 100);
}

function forceReinitializeDropdowns() {
    console.log('Force reinitializing dropdowns...');
    
    const buttons = document.querySelectorAll('.dropdown-multiselect button');
    buttons.forEach(button => {
        // Agregar handler manual
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdown = this.closest('.dropdown-multiselect');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Cerrar otros dropdowns
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(openMenu => {
                if (openMenu !== menu) {
                    openMenu.classList.remove('show');
                }
            });
            
            // Toggle este dropdown
            menu.classList.toggle('show');
        };
        
        console.log('Manual handler added:', button.id);
    });
    
    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-multiselect')) {
            document.querySelectorAll('.dropdown-multiselect .dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
    
    // Agregar event listeners a los checkboxes de los menús
    document.querySelectorAll('.dropdown-multiselect .dropdown-menu').forEach(menu => {
        menu.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
                handleDropdownCheckboxChange(e.target);
            }
        });
    });
}

function handleDropdownCheckboxChange(checkbox) {
    const menu = checkbox.closest('.dropdown-menu');
    const allCheckboxes = menu.querySelectorAll('input[type="checkbox"]');
    const allOption = Array.from(allCheckboxes).find(cb => cb.value === '' || cb.value === 'Todos' || cb.value === 'Todas');
    
    // Si se marca "Todos" (valor vacío), desmarcar todo lo demás
    if ((checkbox.value === '' || checkbox.value === 'Todos' || checkbox.value === 'Todas') && checkbox.checked) {
        allCheckboxes.forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
        });
    }
    // Si se marca cualquier otra cosa, desmarcar "Todos"
    else if (checkbox.value !== '' && checkbox.value !== 'Todos' && checkbox.value !== 'Todas' && checkbox.checked) {
        if (allOption) allOption.checked = false;
    }
    
    // Actualizar texto del botón
    updateDropdownButtonText(menu);
    
    // Aplicar filtros
    applyFilters();
}

function updateDropdownButtonText(menu) {
    const checkedCheckboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
    const button = menu.closest('.dropdown-multiselect').querySelector('.dropdown-toggle');
    const textSpan = button.querySelector('span');
    
    const allValues = Array.from(checkedCheckboxes).map(cb => cb.value);
    const isAllSelected = allValues.includes('') || allValues.includes('Todos') || allValues.includes('Todas') || allValues.length === 0;
    
    // Obtener textos de las opciones marcadas
    const checkedLabels = Array.from(checkedCheckboxes).map(cb => {
        const label = cb.closest('.dropdown-item')?.querySelector('label');
        return label ? label.textContent.trim() : cb.value;
    }).filter(t => t);
    
    if (isAllSelected || checkedLabels.length === 0) {
        // Texto por defecto
        const menuId = menu.id;
        const defaults = {
            'bankFilterMenu': 'Todos los Bancos',
            'statusFilterMenu': 'Todos los Estados',
            'officeFilterMenu': 'Todas las Oficinas',
            'entryTypeFilterMenu': 'Todos los Tipos',
            'operationTypeFilterMenu': 'Todos los Tipos',
            'currencyFilterMenu': 'Todas las Monedas'
        };
        textSpan.textContent = defaults[menuId] || 'Todos';
    } else if (checkedLabels.length <= 2) {
        textSpan.textContent = checkedLabels.join(', ');
    } else {
        textSpan.textContent = checkedLabels.slice(0, 2).join(', ') + ` (+${checkedLabels.length - 2})`;
    }
}

function updateTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center py-5 text-muted">No se encontraron transacciones bancarias.</td></tr>';
        updateBulkActionsVisibility();
        return;
    }

    transactions.forEach(tx => {
        const row = createTransactionRow(tx);
        tbody.appendChild(row);
    });

    setupRowActions();
    setupCheckboxListeners();
    
    if (savedSelectedIds.length > 0) {
        setTimeout(() => restoreSelectedCheckboxes(), 50);
    } else {
        updateBulkActionsVisibility();
    }
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
        <td><input type="checkbox" name="row-select" class="form-check-input" data-transaction-id="${tx.id}"></td>
        <td>${tx.date}</td>
        <td class="font-monospace ref-code">${tx.reference}</td>
        <td class="font-monospace">${tx.original_reference || '--'}</td>
        <td class="bank-name">${tx.bank}</td>
        <td>${tx.office || '--'}</td>
        <td>${tx.operation_type || '--'}</td>
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
                ${(tx.status === 'pending' && window.userPermissions?.can_reconcile) ? `
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
    // 1. Limpiar inputs normales de texto y fechas
    const filterInputs = document.querySelectorAll('.filter-input:not([type="hidden"]), .filter-select');
    filterInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
    });

    // 2. Reiniciar los checkboxes en el DOM (esto faltaba en la versión anterior)
    const isAllOption = (val) => val === '' || val === 'Todos' || val === 'Todas' || val === 'Todos los Bancos';
    
    document.querySelectorAll('.dropdown-multiselect').forEach(dropdown => {
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = isAllOption(cb.value);
        });

        // 3. Restaurar los textos visuales de los botones
        const btn = dropdown.querySelector('.dropdown-toggle');
        const menuId = dropdown.querySelector('.dropdown-menu').id;
        
        const defaultTexts = {
            'bankFilterMenu': 'Todos los Bancos',
            'statusFilterMenu': 'Todos los Estados',
            'officeFilterMenu': 'Todas las Oficinas',
            'entryTypeFilterMenu': 'Todos los Tipos',
            'operationTypeFilterMenu': 'Todos los Tipos',
            'currencyFilterMenu': 'Todas las Monedas'
        };
        
        if (btn && defaultTexts[menuId]) {
            const textSpan = btn.querySelector('span:first-child');
            if (textSpan) textSpan.textContent = defaultTexts[menuId];
        }
    });
    
    // 4. Limpiar los inputs ocultos
    document.querySelectorAll('input[type="hidden"].filter-input').forEach(input => {
        input.value = '';
    });

    // Disparar búsqueda en blanco
    applyFilters();
    showNotification('Filtros reiniciados correctamente', 'info');
}

function getCurrentFilterValues() {
    const statusValue = getFilterValues('statusFilterMenu');
    return {
        date_from: document.getElementById('dateFrom')?.value || '',
        date_to: document.getElementById('dateTo')?.value || '',
        bank: getFilterValues('bankFilterMenu'),
        status: statusValue,
        reference: document.getElementById('referenceFilter')?.value || '',
        name: document.getElementById('nameFilter')?.value || '',
        office_code: getFilterValues('officeFilterMenu'),
        entry_type: getFilterValues('entryTypeFilterMenu'),
        operation_type: getFilterValues('operationTypeFilterMenu'),
        amount_min: document.getElementById('amountMinFilter')?.value || '',
        amount_max: document.getElementById('amountMaxFilter')?.value || '',
        currency: getFilterValues('currencyFilterMenu'),
        page: 1
    };
}

function loadTransactions(filters = {}) {
    if (!filters || Object.keys(filters).length === 0) {
        filters = getCurrentFilterValues();
    } else if (filters.page === undefined) {
        filters.page = 1;
    }
    const queryString = new URLSearchParams(filters).toString();
    console.log('Loading from URL:', `/reconciliation/api/data/?${queryString}`);
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
            updateTable(data.transactions);
            updatePagination(data);
            updateSummaryStats();
        }
    })
    .catch(error => console.error('Error:', error));
}

function updateSummaryStats() {
    fetch('/reconciliation/api/stats/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('totalCount').textContent = data.total_count.toLocaleString('es-ES');
            document.getElementById('reconciledCount').textContent = data.reconciled_count.toLocaleString('es-ES');
            document.getElementById('pendingCount').textContent = data.pending_count.toLocaleString('es-ES');
            document.getElementById('reconciledPercentage').textContent = data.reconciled_percentage;
        }
        finishStateRestore();
    })
    .catch(error => {
        console.error('Error updating stats:', error);
        finishStateRestore();
    });
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
    // Event delegation para checkboxes
    document.addEventListener('click', function(e) {
        if (e.target && e.target.name === 'row-select') {
            updateMasterCheckbox();
            updateBulkActionsVisibility();
        }
    });

    // Event delegation para "selectAll" 
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'selectAll') {
            const rowCheckboxes = document.querySelectorAll('input[name="row-select"]');
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
            updateBulkActionsVisibility();
        }
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

function clearAllCheckboxes() {
    const masterCheckbox = document.getElementById('selectAll');
    if (masterCheckbox) {
        masterCheckbox.checked = false;
        masterCheckbox.indeterminate = false;
    }
    const rowCheckboxes = document.querySelectorAll('input[name="row-select"]');
    rowCheckboxes.forEach(cb => cb.checked = false);
    savedSelectedIds = [];
    updateBulkActionsVisibility();
}

function updateBulkActionsVisibility() {
    const rowCheckboxes = document.querySelectorAll('input[name="row-select"]');
    const selectedCount = Array.from(rowCheckboxes).filter(cb => cb.checked).length;

    const masterCheckbox = document.getElementById('selectAll');
    if (masterCheckbox) {
        masterCheckbox.checked = selectedCount > 0 && selectedCount === rowCheckboxes.length;
        masterCheckbox.indeterminate = selectedCount > 0 && selectedCount < rowCheckboxes.length;
    }

    const bulkReconcileBtn = document.getElementById('bulkReconcileBtn');
    if (bulkReconcileBtn) {
        bulkReconcileBtn.style.display = (selectedCount > 0 && window.userPermissions?.can_reconcile) ? 'flex' : 'none';
    }

    const selectedCountBadge = document.getElementById('selectedCountBadge');
    if (selectedCountBadge) {
        selectedCountBadge.style.display = selectedCount > 0 ? 'flex' : 'none';
        const countText = document.getElementById('selectedCountText');
        const countLabel = document.getElementById('selectedCountLabel');
        if (countText) countText.textContent = selectedCount;
        if (countLabel) countLabel.textContent = selectedCount === 1 ? 'Seleccionada' : 'Seleccionados';
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

            this.blur();

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
            showNotification(data.message, 'success');
            clearAllCheckboxes();
            savedSelectedIds = [];
            loadTransactions(currentFilters);
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
    const cleanMsg = cleanMessage(message);
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    document.querySelectorAll('.reconciliation-alert').forEach(el => el.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `reconciliation-alert alert ${alertClass} alert-dismissible fade show`;
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

    // Actualizar notificaciones del servidor para la campana
    if (type === 'success' && typeof window.reloadNotifications === 'function') {
        setTimeout(() => window.reloadNotifications(), 500);
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

// ===== Conciliación Masiva =====
function openBulkReconcileModal() {
    const selectedTransactions = getSelectedTransactionIds();
    console.log('Selected transactions:', selectedTransactions);
    
    if (selectedTransactions.length === 0) {
        showNotification('No hay transacciones seleccionadas.', 'warning');
        return;
    }

    if (selectedTransactions.length > 50) {
        showNotification('El límite máximo es de 50 transacciones.', 'error');
        return;
    }

    const bulkCountEl = document.getElementById('bulkSelectedCount');
    if (bulkCountEl) {
        bulkCountEl.textContent = selectedTransactions.length;
    }

    const modalElement = document.getElementById('bulkReconcileConfirmModal');
    if (!modalElement) {
        console.error('Modal no encontrado');
        showNotification('Error: Modal no encontrado', 'error');
        return;
    }
    
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
}

function getSelectedTransactionIds() {
    const rowCheckboxes = document.querySelectorAll('input[name="row-select"]:checked');
    return Array.from(rowCheckboxes)
        .map(checkbox => checkbox.getAttribute('data-transaction-id'))
        .filter(id => id);
}

function executeBulkReconcile() {
    const selectedIds = getSelectedTransactionIds();
    
    if (selectedIds.length === 0) {
        showNotification('No hay transacciones para conciliar.', 'warning');
        return;
    }

    const confirmBtn = document.getElementById('confirmBulkReconcileBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Conciliando...';
    }

    fetch('/reconciliation/api/reconcile/bulk/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ 'transaction_ids': selectedIds })
    })
    .then(response => response.json())
    .then(data => {
        const modalElement = document.getElementById('bulkReconcileConfirmModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        if (data.status === 'success') {
            showNotification(data.message, 'success');
            clearAllCheckboxes();
            savedSelectedIds = [];
            loadTransactions(currentFilters);
        } else {
            showNotification(data.message || 'Error al conciliar', 'error');
        }
    })
    .catch(error => {
        console.error('Error en conciliación masiva:', error);
        showNotification('Error al procesar la solicitud.', 'error');
    })
    .finally(() => {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar Conciliación';
        }
    });
}

function updateReconciliationSummaryStatsBulk(count) {
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
    const reconciledCount = parseNumber(reconciledEl.textContent) + count;
    const pendingCount = Math.max(parseNumber(pendingEl.textContent) - count, 0);

    reconciledEl.textContent = reconciledCount.toLocaleString('es-ES');
    pendingEl.textContent = pendingCount.toLocaleString('es-ES');
    percentageEl.textContent = totalCount > 0 ? Math.round((reconciledCount / totalCount) * 100) : '0';
}
