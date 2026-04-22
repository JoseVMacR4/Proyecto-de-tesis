/**
 * ETECSA Finanzas - Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target) && 
                sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
        });
    }

    // Handle active states on sidebar links with smooth transitions
    const navLinks = document.querySelectorAll('.nav-item-custom');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle transitions for actual navigation links (not '#')
            if (href && href !== '#') {
                e.preventDefault();
                
                // Add fade-out animation to main content
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.style.opacity = '0';
                    mainContent.style.transform = 'translateY(10px)';
                    mainContent.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
                }
                
                // Navigate after animation completes
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            } else {
                // For non-navigation links, just update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
            
            // On mobile, close sidebar after clicking a link
            if (window.innerWidth < 992 && sidebar) {
                sidebar.classList.remove('show');
            }
        });
    });

    console.log('Dashboard Transitions Initialized');
});

