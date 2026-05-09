document.addEventListener('DOMContentLoaded', function() {
    const dataEl = document.getElementById('dashboard-data');
    const reconciled = parseInt(dataEl?.dataset.reconciled) || 0;
    const pending = parseInt(dataEl?.dataset.pending) || 0;

    const ctx = document.getElementById('pieChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Conciliados', 'Pendientes'],
                datasets: [{
                    data: [reconciled, pending],
                    backgroundColor: ['#005596', '#87C038'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        zIndex: 1000,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.raw / total) * 100) : 0;
                                return context.label + ': ' + context.raw + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    duration: 800
                }
            }
        });
    }
});