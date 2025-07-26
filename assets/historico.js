const HistoricalChart = {
    config: {
        apiBase: 'https://mindicador.cl/api',
        chartColors: {
            UF: '#4e73df',
            USD: '#1cc88a',
            EUR: '#36b9cc',
            IVP: '#f6c23e',
            UTM: '#e74a3b',
            COBRE: '#fd7e14',
            BTC: '#6f42c1'
        }
    },

    currentChart: null,
    init() {
        
        if (document.getElementById('toCurrency')) {
            document.getElementById('toCurrency').addEventListener('change', (e) => {
                if (e.target.value !== 'CLP') {
                    this.loadData(e.target.value);
                } else {
                    this.hideChart();
                }
            });
        }
    },

    async loadData(indicator) {
        try {
            this.showLoading();
            
            const endpoint = this.getApiEndpoint(indicator);
            const response = await fetch(`${this.config.apiBase}/${endpoint}`);
            const data = await response.json();
            
            if (!data.serie) throw new Error('Formato de datos no válido');
            
            const { labels, values } = this.processData(data.serie, indicator);
            
            this.renderChart(labels, values, indicator);
            
            this.updateUI(indicator, data.serie[0].fecha);
            
        } catch (error) {
            console.error(`Error al cargar ${indicator}:`, error);
            this.showError(`No se pudo cargar el histórico para ${indicator}`);
        }
    },

    getApiEndpoint(indicator) {
        const endpoints = {
            'USD': 'dolar',
            'USD_ACUERDO': 'dolar_intercambio',
            'EUR': 'euro',
            'UF': 'uf',
            'IVP': 'ivp',
            'UTM': 'utm',
            'COBRE': 'libra_cobre',
            'BTC': 'bitcoin'
        };
        return endpoints[indicator] || indicator.toLowerCase();
    },

    processData(dataSeries, indicator) {
        const validData = dataSeries.filter(item => item.valor !== null);
        const last10Days = validData.slice(-11, -1).reverse();
        
        if (last10Days.length < 5) throw new Error('Datos insuficientes');
        
        const labels = last10Days.map(item => 
            new Date(item.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
        );
        
        const values = last10Days.map(item => 
            indicator === 'COBRE' || indicator === 'BTC' 
                ? item.valor * (window.currentRates?.USD?.CLP || 950)
                : item.valor
        );
        
        return { labels, values };
    },

    renderChart(labels, data, indicator) {
        const ctx = document.getElementById('historical-chart').getContext('2d');
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${indicator} (CLP)`,
                    data: data,
                    borderColor: this.config.chartColors[indicator] || '#3498db',
                    backgroundColor: this.hexToRgba(this.config.chartColors[indicator] || '#3498db', 0.1),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: this.config.chartColors[indicator] || '#3498db',
                    pointRadius: 4
                }]
            },
            options: this.getChartOptions(indicator)
        });
        
        this.showChart();
    },

    getChartOptions(indicator) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y;
                            return `${indicator}: $${value.toLocaleString('es-CL')}${indicator === 'COBRE' || indicator === 'BTC' ? ' CLP' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: (value) => `$${value.toLocaleString('es-CL')}`
                    }
                }
            }
        };
    },

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    showLoading() {
        const canvas = document.getElementById('historical-chart');
        if (canvas) canvas.style.display = 'none';
        
        const nameElement = document.getElementById('chart-indicator-name');
        if (nameElement) nameElement.textContent = '(Cargando...)';
        
        this.showChart();
    },

    showChart() {
        const container = document.getElementById('historical-chart-container');
        if (container) container.style.display = 'block';
    },

    hideChart() {
        const container = document.getElementById('historical-chart-container');
        if (container) container.style.display = 'none';
    },

    updateUI(indicator, lastUpdateDate) {
        const canvas = document.getElementById('historical-chart');
        if (canvas) canvas.style.display = 'block';
        
        const nameElement = document.getElementById('chart-indicator-name');
        if (nameElement) nameElement.textContent = `(${indicator})`;
        
        const dateElement = document.getElementById('chart-update-date');
        if (dateElement) {
            dateElement.textContent = new Date(lastUpdateDate).toLocaleDateString('es-CL');
        }
    },

    showError(message) {
        const container = document.getElementById('historical-chart-container');
        if (container) {
            container.innerHTML = `
                <div class="chart-error">
                    <p>${message}</p>
                    <button onclick="HistoricalChart.retry()" class="retry-button">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    retry() {
        const currentIndicator = document.getElementById('toCurrency')?.value;
        if (currentIndicator) {
            this.loadData(currentIndicator);
        }
    }
};
document.addEventListener('DOMContentLoaded', () => HistoricalChart.init());