/**
 * ETECSA Finanzas - Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===== TABS NAVIGATION =====
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const activeContent = document.querySelector(`[data-tab-content="${tabName}"]`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
            
            console.log(`Settings tab switched to: ${tabName}`);
        });
    });

    // ===== PROFILE SECTION =====
    const editProfileBtn = document.querySelector('.btn-edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            console.log('Edit profile clicked');
            // TODO: Open modal or redirect to edit profile page
        });
    }

    // ===== BANKS SECTION =====
    const addBankBtn = document.querySelector('.btn-add-bank');
    if (addBankBtn) {
        addBankBtn.addEventListener('click', function() {
            console.log('Add bank clicked');
            // TODO: Open modal to add new bank
        });
    }

    const bankEditBtns = document.querySelectorAll('.btn-bank-action');
    bankEditBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            console.log(`Edit bank: ${bankName}`);
            // TODO: Open modal to edit bank
        });
    });

    // ===== SECURITY SECTION =====
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('inactive');
            
            const isActive = !this.classList.contains('inactive');
            console.log(`2FA Authentication: ${isActive ? 'ON' : 'OFF'}`);
            // TODO: Send AJAX request to save setting
        });
    });

    const changePasswordLink = document.querySelector('.security-link');
    if (changePasswordLink) {
        changePasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Change password clicked');
            // TODO: Open modal to change password
        });
    }

    // ===== PERMISSIONS SECTION =====
    const viewPermissionsBtn = document.querySelector('.btn-view-permissions');
    if (viewPermissionsBtn) {
        viewPermissionsBtn.addEventListener('click', function() {
            console.log('View permissions clicked');
            // TODO: Open modal or redirect to permissions page
        });
    }

    // ===== INITIALIZATION LOG =====
    console.log('Settings Page Initialized Successfully');
});
