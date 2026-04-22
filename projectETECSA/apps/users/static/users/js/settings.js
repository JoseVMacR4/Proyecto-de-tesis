/**
 * ETECSA Finanzas - Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Settings Tabs Navigation
    const tabs = document.querySelectorAll('.settings-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Here you could add logic to show/hide different settings sections
            // based on the selected tab
            console.log(`Settings tab clicked: ${this.textContent.trim()}`);
        });
    });

    // Toggle Switch Functionality
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('inactive');
            
            // Get the current state
            const isActive = !this.classList.contains('inactive');
            console.log(`Toggle switched: ${isActive ? 'ON' : 'OFF'}`);
            
            // Here you could add AJAX call to save the setting
        });
    });

    // Edit Profile Button
    const editProfileBtn = document.querySelector('.btn-edit-profile');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            console.log('Edit profile clicked');
            // Here you could open a modal or redirect to edit profile page
        });
    }

    // Add Bank Button
    const addBankBtn = document.querySelector('.btn-add-bank');
    
    if (addBankBtn) {
        addBankBtn.addEventListener('click', function() {
            console.log('Add bank clicked');
            // Here you could open a modal to add a new bank
        });
    }

    // Bank Edit Buttons
    const bankEditBtns = document.querySelectorAll('.btn-bank-action');
    
    bankEditBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const bankItem = this.closest('.bank-item');
            const bankName = bankItem.querySelector('.bank-name').textContent;
            console.log(`Edit bank: ${bankName}`);
            // Here you could open a modal to edit the bank
        });
    });

    // View Permissions Button
    const viewPermissionsBtn = document.querySelector('.btn-view-permissions');
    
    if (viewPermissionsBtn) {
        viewPermissionsBtn.addEventListener('click', function() {
            console.log('View permissions clicked');
            // Here you could open a modal or redirect to permissions page
        });
    }

    // Change Password Link
    const changePasswordLink = document.querySelector('.security-link');
    
    if (changePasswordLink) {
        changePasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Change password clicked');
            // Here you could open a modal to change password
        });
    }

    console.log('Settings Page Initialized');
});
