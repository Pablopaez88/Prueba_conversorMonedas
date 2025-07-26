const backupRates = {
            CLP: { CLP: 1, USD: 0.00105, USD_ACUERDO: 0.00132, EUR: 0.000895, UF: 0.0000255, IVP: 0.0000245, UTM: 0.0000145, COBRE: 0.00022, BTC: 0.0000000085 },
            USD: { CLP: 948.93, USD: 1, USD_ACUERDO: 1.25, EUR: 0.85, UF: 0.0255, IVP: 0.0245, UTM: 0.0145, COBRE: 0.22, BTC: 0.0000085 },
            USD_ACUERDO: { CLP: 758.87, USD: 0.8, USD_ACUERDO: 1, EUR: 0.68, UF: 0.0204, IVP: 0.0196, UTM: 0.0116, COBRE: 0.176, BTC: 0.0000068 },
            EUR: { CLP: 1116.78, USD: 1.18, USD_ACUERDO: 1.47, EUR: 1, UF: 0.03, IVP: 0.0288, UTM: 0.0171, COBRE: 0.26, BTC: 0.00001 },
            UF: { CLP: 39214.48, USD: 41.34, USD_ACUERDO: 51.67, EUR: 35.0, UF: 1, IVP: 0.96, UTM: 0.57, COBRE: 8.63, BTC: 0.00033 },
            IVP: { CLP: 40801.22, USD: 43.0, USD_ACUERDO: 53.75, EUR: 36.42, UF: 1.04, IVP: 1, UTM: 0.59, COBRE: 8.98, BTC: 0.00034 },
            UTM: { CLP: 68923, USD: 72.66, USD_ACUERDO: 90.82, EUR: 61.54, UF: 1.76, IVP: 1.69, UTM: 1, COBRE: 15.17, BTC: 0.00058 },
            COBRE: { CLP: 4543, USD: 4.79, USD_ACUERDO: 5.99, EUR: 4.06, UF: 0.116, IVP: 0.111, UTM: 0.066, COBRE: 1, BTC: 0.000038 },
            BTC: { CLP: 117446790, USD: 117446.79, USD_ACUERDO: 146808.49, EUR: 100000, UF: 3000, IVP: 2900, UTM: 1724, COBRE: 26316, BTC: 1 }
        };

        let currentRates = {};
        let lastUpdate = "";

        async function loadExchangeRates() {
            try {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('result').style.display = 'none';
                
                const response = await fetch('https://mindicador.cl/api');
                const data = await response.json();
                
                if (!response.ok || data.version === undefined) {
                    throw new Error('Error al obtener datos de la API');
                }
                
                currentRates = {
                    CLP: { CLP: 1 },
                    USD: { CLP: data.dolar.valor },
                    USD_ACUERDO: { CLP: data.dolar_intercambio.valor },
                    EUR: { CLP: data.euro.valor },
                    UF: { CLP: data.uf.valor },
                    IVP: { CLP: data.ivp.valor },
                    UTM: { CLP: data.utm.valor },
                    COBRE: { CLP: data.libra_cobre.valor * data.dolar.valor },
                    BTC: { CLP: data.bitcoin.valor * data.dolar.valor }
                };
                
                const currencies = ['CLP', 'USD', 'USD_ACUERDO', 'EUR', 'UF', 'IVP', 'UTM', 'COBRE', 'BTC'];
                
                for (let from of currencies) {
                    if (!currentRates[from]) currentRates[from] = {};
                    for (let to of currencies) {
                        if (from === to) {
                            currentRates[from][to] = 1;
                        } else {
                            if (from !== 'CLP' && to !== 'CLP') {
                                currentRates[from][to] = currentRates[from].CLP / currentRates[to].CLP;
                            } else if (from === 'CLP') {
                                currentRates[from][to] = 1 / currentRates[to].CLP;
                            } else {
                                currentRates[from][to] = currentRates[from].CLP;
                            }
                        }
                    }
                }
                
                lastUpdate = new Date(data.uf.fecha).toLocaleString('es-CL');
                document.getElementById('updateInfo').innerHTML = `
                    <strong>Datos actualizados al:</strong> ${lastUpdate}<br>
                    <div class="rate-info">
                        <strong>Tasas clave:</strong><br>
                        UF: $${data.uf.valor.toLocaleString('es-CL')} | 
                        Dólar: $${data.dolar.valor.toLocaleString('es-CL')} | 
                        Euro: $${data.euro.valor.toLocaleString('es-CL')} | 
                        Bitcoin: $${(data.bitcoin.valor * data.dolar.valor).toLocaleString('es-CL')}
                    </div>
                `;
                
                document.getElementById('loading').style.display = 'none';
                return true;
            } catch (error) {
                console.error('Error al cargar tasas:', error);
                document.getElementById('updateInfo').innerHTML = 
                    `<span class="error">Error al cargar datos actualizados. Usando valores de respaldo (${new Date().toLocaleDateString('es-CL')}).</span>`;
                document.getElementById('loading').style.display = 'none';
                currentRates = backupRates;
                return false;
            }
        }

        document.addEventListener('DOMContentLoaded', async function() {
            await loadExchangeRates();
        });

        document.getElementById('convertBtn').addEventListener('click', function() {
            const amount = parseFloat(document.getElementById('amount').value);
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (isNaN(amount)) {
                alert('Por favor ingrese una cantidad válida');
                return;
            }
            
            if (fromCurrency === toCurrency) {
                document.getElementById('result').innerHTML = `
                    <strong>No se requiere conversión:</strong><br>
                    ${amount.toLocaleString('es-CL')} ${fromCurrency} = ${amount.toLocaleString('es-CL')} ${toCurrency}
                `;
                document.getElementById('result').style.display = 'block';
                return;
            }
            
            if (Object.keys(currentRates).length === 0 || !currentRates[fromCurrency] || !currentRates[fromCurrency][toCurrency]) {
                alert('Las tasas de cambio no se han cargado correctamente. Por favor intente nuevamente.');
                return;
            }
            
            const rate = currentRates[fromCurrency][toCurrency];
            const result = amount * rate;
            
            const formatNumber = (value, currency) => {
                if (['CLP', 'USD', 'USD_ACUERDO', 'EUR', 'UF', 'IVP', 'UTM'].includes(currency)) {
                    return value.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (currency === 'COBRE') {
                    return value.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
                } else if (currency === 'BTC') {
                    return value.toLocaleString('es-CL', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
                }
                return value;
            };
            
            const resultElement = document.getElementById('result');
            resultElement.innerHTML = `
                <strong>${formatNumber(amount, fromCurrency)} ${fromCurrency} = ${formatNumber(result, toCurrency)} ${toCurrency}</strong>
                <div class="rate-info">
                    <strong>Tasa de cambio:</strong> 1 ${fromCurrency} = ${rate.toExponential(4)} ${toCurrency}<br>
                    <strong>Valor en CLP:</strong> 
                    ${fromCurrency !== 'CLP' ? `1 ${fromCurrency} = ${formatNumber(currentRates[fromCurrency].CLP, 'CLP')} CLP` : ''}
                    ${toCurrency !== 'CLP' ? ` | 1 ${toCurrency} = ${formatNumber(currentRates[toCurrency].CLP, 'CLP')} CLP` : ''}
                </div>
            `;
            resultElement.style.display = 'block';
        });

        document.getElementById('fromCurrency').addEventListener('change', async function() {
            await loadExchangeRates();
        });

        document.getElementById('toCurrency').addEventListener('change', async function() {
            await loadExchangeRates();
        });