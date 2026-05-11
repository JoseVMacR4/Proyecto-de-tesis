document.addEventListener('DOMContentLoaded', function() {
    initConciliationTrend();
    initStatusDistribution();
    initIncomeExpense();
    initFeesEvolution();
    initTopOperations();
    initAccountVolume();
});

// === CHARTS INITIALIZATION ===
const CHART_COLORS = {
    primary: '#005596',
    secondary: '#87C038',
    tertiary: '#6432AA',
    success: '#00A86B',
    error: '#C83232',
    warning: '#FFB800'
};

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        }
    }
};

async function fetchChartData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching data');
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

function initConciliationTrend() {
    const canvas = document.getElementById('conciliationTrendChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/conciliation-trend/').then(data => {
        if (!data) return;

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Conciliado',
                        data: data.reconciled,
                        backgroundColor: CHART_COLORS.primary,
                        borderRadius: 4
                    },
                    {
                        label: 'Pendiente',
                        data: data.pending,
                        backgroundColor: CHART_COLORS.secondary,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

function initStatusDistribution() {
    const canvas = document.getElementById('statusDistributionChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/status-distribution/').then(data => {
        if (!data) return;

        document.getElementById('reconciledCount').textContent = data.reconciled.toLocaleString();
        document.getElementById('pendingCount').textContent = data.pending.toLocaleString();

        const percentage = data.total > 0 ? Math.round((data.reconciled / data.total) * 100) : 0;

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Conciliado', 'Pendiente'],
                datasets: [{
                    data: [data.reconciled, data.pending],
                    backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                ...chartDefaults,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = data.total;
                                const pct = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value.toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    var width = chart.width, height = chart.height, ctx = chart.ctx;
                    ctx.restore();
                    var fontSize = (height / 114).toFixed(2);
                    ctx.font = 'bold ' + fontSize + 'em Inter';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = CHART_COLORS.primary;
                    var text = percentage + '%',
                        textX = Math.round((width - ctx.measureText(text).width) / 2),
                        textY = height / 2;
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
    });
}

function initIncomeExpense() {
    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/income-expense/').then(data => {
        if (!data) return;

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: data.credits,
                        backgroundColor: CHART_COLORS.success,
                        borderRadius: 4
                    },
                    {
                        label: 'Egresos',
                        data: data.debits,
                        backgroundColor: CHART_COLORS.error,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

function initFeesEvolution() {
    const canvas = document.getElementById('feesEvolutionChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/fees-evolution/').then(data => {
        if (!data) return;

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Comisiones',
                    data: data.values,
                    borderColor: CHART_COLORS.tertiary,
                    backgroundColor: 'rgba(100, 50, 170, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: CHART_COLORS.tertiary
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

function initTopOperations() {
    const canvas = document.getElementById('topOperationsChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/top-operations/').then(data => {
        if (!data || !data.labels.length) {
            canvas.parentElement.innerHTML = '<p class="text-muted text-center py-5">No hay datos disponibles</p>';
            return;
        }

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Transacciones',
                    data: data.values,
                    backgroundColor: [
                        CHART_COLORS.primary,
                        CHART_COLORS.secondary,
                        CHART_COLORS.tertiary,
                        CHART_COLORS.success,
                        CHART_COLORS.warning
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                ...chartDefaults,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    });
}

function initAccountVolume() {
    const canvas = document.getElementById('accountVolumeChart');
    if (!canvas) return;

    fetchChartData('/reporting/api/account-volume/').then(data => {
        if (!data || !data.labels.length) {
            canvas.parentElement.innerHTML = '<p class="text-muted text-center py-5">No hay datos disponibles</p>';
            return;
        }

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Transacciones',
                    data: data.values,
                    backgroundColor: CHART_COLORS.primary,
                    borderRadius: 4
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}