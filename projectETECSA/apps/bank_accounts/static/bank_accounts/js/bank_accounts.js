/**
 * Bank Accounts Page JavaScript
 * Handles interactions for account management UI
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Bank Accounts Module Initialized');

    // Initialize event listeners
    initializeSearch();
    initializeAccountMenu();
    initializeAddAccountBtn();
});

/**
 * Search functionality for accounts
 */
function initializeSearch() {
    const searchInput = document.getElementById('accountSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const tableRows = document.querySelectorAll('.table-custom tbody tr');

        tableRows.forEach(row => {
            const accountNumber = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
            const bankName = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';

            if (accountNumber.includes(searchTerm) || bankName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

/**
 * Account menu interactions
 */
function initializeAccountMenu() {
    const menuButtons = document.querySelectorAll('.account-menu');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Account menu clicked');
            // Placeholder for context menu or modal
            alert('Menú de opciones (editar, exportar, eliminar)');
        });
    });
}

/**
 * Add new account button
 */
function initializeAddAccountBtn() {
    const addBtn = document.getElementById('addAccountBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', function() {
        console.log('Add account button clicked');
        // Placeholder for modal or form
        alert('Abrir formulario para agregar nueva cuenta');
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
 * Utility function to highlight negative balances
 */
function highlightNegativeBalances() {
    const balanceCells = document.querySelectorAll('.table-custom tbody tr td:nth-child(5)');

    balanceCells.forEach(cell => {
        const value = parseFloat(cell.textContent.replace(/[$,]/g, ''));
        if (value < 0) {
            cell.style.color = 'var(--error)';
            cell.style.fontWeight = '600';
        }
    });
}

// Initialize negative balance highlights on page load
window.addEventListener('load', highlightNegativeBalances);