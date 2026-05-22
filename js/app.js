const API_BASE_URL = 'https://localhost:7154/api';

document.addEventListener('DOMContentLoaded', async () => {

    // --- LOGIC FOR LOGIN PAGE (index.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const email = usernameInput.value;
            const password = passwordInput.value;
            
            // Simple visual loading state
            btn.innerText = 'Verificando...';
            btn.style.opacity = '0.8';
            btn.disabled = true; // Disable button to prevent multiple submissions

            try {
                const response = await fetch(`${API_BASE_URL}/Auth/login`, { // Asume un endpoint /login
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) { // HTTP status code 200-299
                    const data = await response.json();
                    const token = data?.token || data?.accessToken || data?.jwt;
                    if (token) {
                        sessionStorage.setItem('authToken', token);
                    }
                    window.location.href = 'dashboard.html';
                } else {
                    // Handle login errors (e.g., invalid credentials)
                    const errorData = await response.json(); // Assuming backend sends JSON error
                    alert(`Error de inicio de sesión: ${errorData.message || 'Credenciales inválidas.'}`);
                    btn.innerText = originalText;
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }
            } catch (error) {
                // Handle network errors or issues with the backend server
                console.error('Error de red o CORS:', error);
                alert('No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.');
                btn.innerText = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        });
    }

    // --- LOGIC FOR DASHBOARD PAGE (dashboard.html) ---
    const movementForm = document.getElementById('movementForm');
    const tableBody = document.getElementById('tableBody');
    const logoutBtn = document.getElementById('logoutBtn');

    // KPI Elements
    const kpiIngresos = document.getElementById('kpi-ingresos');
    const kpiEgresos = document.getElementById('kpi-egresos');
    const kpiBalance = document.getElementById('kpi-balance');

    // Set today's date as default in the form
    const dateInput = document.getElementById('fecha');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Function to load and render movements from LocalStorage
    const loadMovements = () => {
        if (!tableBody) return; // Not on dashboard page
        
        let movements = JSON.parse(localStorage.getItem('movements')) || [];
        
        // Clear table
        tableBody.innerHTML = '';
        
        let totalIngresos = 0;
        let totalEgresos = 0;

        // Render each movement (assuming new at the end of array, so we loop backwards or reverse)
        [...movements].reverse().forEach((mov) => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', mov.id); // Guardar ID para edición
            
            if (mov.tipo === 'ingreso') {
                totalIngresos += mov.monto;
            } else {
                totalEgresos += mov.monto;
            }

            const formattedMonto = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(mov.monto);

            let badgeClass = mov.tipo === 'ingreso' ? 'income' : 'expense';
            let badgeText = mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso';
            let colorVar = mov.tipo === 'ingreso' ? 'var(--success-color)' : 'var(--danger-color)';
            let sign = mov.tipo === 'ingreso' ? '+' : '-';

            row.innerHTML = `
                <td>${mov.fecha}</td>
                <td>${mov.concepto}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td style="color: ${colorVar}">${sign}${formattedMonto}</td>
            `;
            tableBody.appendChild(row);
        });

        // Update KPIs
        const balance = totalIngresos - totalEgresos;
        
        const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

        if (kpiIngresos) kpiIngresos.innerText = formatCurrency(totalIngresos);
        if (kpiEgresos) kpiEgresos.innerText = formatCurrency(totalEgresos);
        if (kpiBalance) kpiBalance.innerText = formatCurrency(balance);
    };

    // Initial load
    loadMovements();

    if (movementForm) {
        movementForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get values
            const tipo = document.getElementById('tipo').value;
            const fecha = document.getElementById('fecha').value;
            const concepto = document.getElementById('concepto').value;
            const monto = parseFloat(document.getElementById('monto').value);

            if (isNaN(monto) || monto <= 0) {
                alert("Por favor ingresa un monto válido mayor a 0.");
                return;
            }

            // Create new object
            const newMovement = {
                id: Date.now(),
                tipo,
                fecha,
                concepto,
                monto
            };

            // Save to localStorage
            let movements = JSON.parse(localStorage.getItem('movements')) || [];
            movements.push(newMovement);
            localStorage.setItem('movements', JSON.stringify(movements));

            // Reload UI
            loadMovements();

            // Reset form (keep date)
            movementForm.reset();
            dateInput.valueAsDate = new Date();
            
            // Focus on concept for quick entry
            document.getElementById('concepto').focus();
        });
    }

    // Inline editing logic on double click
    if (tableBody) {
        tableBody.addEventListener('dblclick', (e) => {
            const td = e.target.closest('td');
            if (!td) return;
            
            const tr = td.closest('tr');
            const id = parseInt(tr.getAttribute('data-id'));
            if (!id) return;

            // Get the cell index
            const cellIndex = Array.from(tr.children).indexOf(td);
            
            // Avoid editing if it's already an input/select
            if (td.querySelector('input') || td.querySelector('select')) return;

            let movements = JSON.parse(localStorage.getItem('movements')) || [];
            let movIndex = movements.findIndex(m => m.id === id);
            if (movIndex === -1) return;
            let mov = movements[movIndex];

            let originalValue;
            let inputHTML = '';

            if (cellIndex === 0) { // Fecha
                originalValue = mov.fecha;
                inputHTML = `<input type="date" class="form-control" value="${originalValue}" style="padding: 0.25rem; font-size: 0.875rem;">`;
            } else if (cellIndex === 1) { // Concepto
                originalValue = mov.concepto;
                inputHTML = `<input type="text" class="form-control" value="${originalValue}" style="padding: 0.25rem; font-size: 0.875rem;">`;
            } else if (cellIndex === 2) { // Tipo
                originalValue = mov.tipo;
                inputHTML = `
                    <select class="form-control" style="padding: 0.25rem; font-size: 0.875rem;">
                        <option value="ingreso" ${originalValue === 'ingreso' ? 'selected' : ''}>Ingreso</option>
                        <option value="egreso" ${originalValue === 'egreso' ? 'selected' : ''}>Egreso</option>
                    </select>
                `;
            } else if (cellIndex === 3) { // Monto
                originalValue = mov.monto;
                inputHTML = `<input type="number" step="0.01" class="form-control" value="${originalValue}" style="padding: 0.25rem; font-size: 0.875rem;">`;
            } else {
                return;
            }

            td.innerHTML = inputHTML;
            const inputElement = td.firstElementChild;
            inputElement.focus();

            const saveEdit = () => {
                let newValue = inputElement.value;
                if (cellIndex === 3) { // Monto
                    newValue = parseFloat(newValue);
                    if (isNaN(newValue) || newValue <= 0) {
                        alert("Monto inválido");
                        loadMovements(); // revert
                        return;
                    }
                    mov.monto = newValue;
                } else if (cellIndex === 0) {
                    mov.fecha = newValue;
                } else if (cellIndex === 1) {
                    mov.concepto = newValue;
                } else if (cellIndex === 2) {
                    mov.tipo = newValue;
                }

                movements[movIndex] = mov;
                localStorage.setItem('movements', JSON.stringify(movements));
                loadMovements(); // refresh table and KPIs
            };

            inputElement.addEventListener('blur', saveEdit);
            inputElement.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    saveEdit();
                } else if (evt.key === 'Escape') {
                    loadMovements(); // revert
                }
            });
        });
    }

    // Logout logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    }

    // --- LOGIC FOR TARJETAS PAGE (tarjetas.html) ---
    // --- LOGIC FOR TARJETAS PAGE (tarjetas.html) ---
    const masterCardForm = document.getElementById('masterCardForm');
    const masterCardsBody = document.getElementById('masterCardsBody');
    const cardMovementForm = document.getElementById('cardMovementForm');
    const cardTableBody = document.getElementById('cardTableBody');
    const tarjetaSelect = document.getElementById('tarjeta_id');
    const tarjetasStatus = document.getElementById('tarjetasStatus');

    const apiBaseUrl = API_BASE_URL;
    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const showTarjetasStatus = (message = '', type = 'info') => {
        if (!tarjetasStatus) return;
        tarjetasStatus.innerText = message;
        tarjetasStatus.style.display = message ? 'block' : 'none';
        tarjetasStatus.style.backgroundColor = type === 'error' ? 'rgba(255,77,77,0.12)' : 'rgba(16,185,129,0.12)';
        tarjetasStatus.style.color = type === 'error' ? '#991b1b' : '#0f766e';
    };

    // Default dates
    const dateCompraInput = document.getElementById('fecha_consumo');
    if (dateCompraInput) dateCompraInput.valueAsDate = new Date();

    const loadCards = async () => {
        if (!masterCardsBody) return;

        let cards = [];
        try {
            const response = await fetch(`${apiBaseUrl}/cards`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            cards = await response.json();
            localStorage.setItem('cards', JSON.stringify(cards));
            showTarjetasStatus('Tarjetas sincronizadas con el backend.', 'info');
        } catch (error) {
            console.warn('Error cargando tarjetas desde backend:', error);
            cards = JSON.parse(localStorage.getItem('cards')) || [];
            showTarjetasStatus('No se pudo sincronizar las tarjetas. Mostrando datos locales.', 'error');
        }

        masterCardsBody.innerHTML = '';

        if (tarjetaSelect) {
            tarjetaSelect.innerHTML = '<option value="" disabled selected>Elige una tarjeta...</option>';
        }

        cards.forEach(card => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${card.nombre}</strong></td>
                <td>${card.propietario}</td>
                <td><span class="badge ${card.tipo === 'credito' ? 'expense' : 'income'}">${card.tipo === 'credito' ? 'Crédito' : 'Débito'}</span></td>
                <td>Día ${card.dia_cierre}</td>
            `;
            masterCardsBody.appendChild(row);

            if (tarjetaSelect) {
                const option = document.createElement('option');
                option.value = card.id;
                option.textContent = `${card.nombre} (${card.propietario})`;
                tarjetaSelect.appendChild(option);
            }
        });
    };

    const loadCardMovements = async () => {
        if (!cardTableBody) return;

        let cards = JSON.parse(localStorage.getItem('cards')) || [];
        let cardMovements = [];

        try {
            const response = await fetch(`${apiBaseUrl}/cardmovements`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            cardMovements = await response.json();
            localStorage.setItem('card_movements', JSON.stringify(cardMovements));
            showTarjetasStatus('Consumos sincronizados con el backend.', 'info');
        } catch (error) {
            console.warn('Error cargando consumos desde backend:', error);
            cardMovements = JSON.parse(localStorage.getItem('card_movements')) || [];
            showTarjetasStatus('No se pudo sincronizar los consumos. Mostrando datos locales.', 'error');
        }

        cardTableBody.innerHTML = '';

        [...cardMovements].reverse().forEach((mov) => {
            const card = cards.find(c => c.id == mov.tarjeta_id);
            if (!card) return;

            const row = document.createElement('tr');
            const formattedMonto = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(mov.monto);

            let badgeClass = card.tipo === 'credito' ? 'expense' : 'income';
            let badgeText = card.tipo === 'credito' ? 'Crédito' : 'Débito';

            row.innerHTML = `
                <td>${mov.fecha_consumo}</td>
                <td>
                    <strong>${card.nombre}</strong> <br>
                    <small style="color: var(--text-secondary)">${card.propietario}</small> <br>
                    <span class="badge ${badgeClass}" style="font-size: 0.6rem;">${badgeText}</span>
                </td>
                <td>${mov.concepto}</td>
                <td style="color: var(--danger-color)">-${formattedMonto}</td>
            `;
            cardTableBody.appendChild(row);
        });
    };

    // Initialize Tarjetas Page
    await loadCards();
    await loadCardMovements();

    // Handle New Card Registration
    if (masterCardForm) {
        masterCardForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipo = document.getElementById('tipo_tarjeta').value;
            const nombre = document.getElementById('nombre_tarjeta').value;
            const propietario = document.getElementById('propietario_tarjeta').value;
            const dia_cierre = document.getElementById('dia_cierre').value;

            const newCard = {
                tipo,
                nombre,
                propietario,
                dia_cierre
            };

            try {
                const response = await fetch(`${apiBaseUrl}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify(newCard)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const savedCard = await response.json();
                let cards = JSON.parse(localStorage.getItem('cards')) || [];
                cards.push(savedCard);
                localStorage.setItem('cards', JSON.stringify(cards));
                showTarjetasStatus('Tarjeta guardada en el backend.', 'info');
                await loadCards();
                masterCardForm.reset();
            } catch (error) {
                console.error('Error guardando tarjeta en backend:', error);
                alert('No se pudo guardar la tarjeta en el backend. Intenta de nuevo.');
            }
        });
    }

    // Handle New Consumption Registration
    if (cardMovementForm) {
        cardMovementForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tarjeta_id = document.getElementById('tarjeta_id').value;
            if (!tarjeta_id) {
                alert("Por favor selecciona una tarjeta primero.");
                return;
            }

            const fecha_consumo = document.getElementById('fecha_consumo').value;
            const cuotas = parseInt(document.getElementById('cuotas').value) || 1;
            const concepto = document.getElementById('concepto_tarjeta').value;
            const monto = parseFloat(document.getElementById('monto_tarjeta').value);

            if (isNaN(monto) || monto <= 0) {
                alert("Por favor ingresa un monto válido mayor a 0.");
                return;
            }

            const newMovement = {
                tarjeta_id,
                fecha_consumo,
                cuotas,
                concepto,
                monto
            };

            try {
                const response = await fetch(`${apiBaseUrl}/cardmovements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify(newMovement)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const savedMovement = await response.json();
                let cardMovements = JSON.parse(localStorage.getItem('card_movements')) || [];
                cardMovements.push(savedMovement);
                localStorage.setItem('card_movements', JSON.stringify(cardMovements));
                showTarjetasStatus('Consumo guardado en el backend.', 'info');
                await loadCardMovements();

                document.getElementById('concepto_tarjeta').value = '';
                document.getElementById('monto_tarjeta').value = '';
                document.getElementById('concepto_tarjeta').focus();
            } catch (error) {
                console.error('Error guardando consumo en backend:', error);
                alert('No se pudo guardar el consumo en el backend. Intenta de nuevo.');
            }
        });
    }

});
