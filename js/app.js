document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIC FOR LOGIN PAGE (index.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;
            
            // Simple visual loading state
            btn.innerText = 'Verificando...';
            btn.style.opacity = '0.8';

            // Simulate network request
            setTimeout(() => {
                // For this demo, just redirect to dashboard
                window.location.href = 'dashboard.html';
            }, 800);
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
            // In a real app, clear tokens/session here
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

    // Default dates
    const dateCompraInput = document.getElementById('fecha_consumo');
    if (dateCompraInput) dateCompraInput.valueAsDate = new Date();

    const loadCards = () => {
        if (!masterCardsBody) return;
        
        let cards = JSON.parse(localStorage.getItem('cards')) || [];
        
        // Populate Master Cards Table
        masterCardsBody.innerHTML = '';
        
        // Populate Select Dropdown
        if (tarjetaSelect) {
            tarjetaSelect.innerHTML = '<option value="" disabled selected>Elige una tarjeta...</option>';
        }

        cards.forEach(card => {
            // Row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${card.nombre}</strong></td>
                <td>${card.propietario}</td>
                <td><span class="badge ${card.tipo === 'credito' ? 'expense' : 'income'}">${card.tipo === 'credito' ? 'Crédito' : 'Débito'}</span></td>
                <td>Día ${card.dia_cierre}</td>
            `;
            masterCardsBody.appendChild(row);

            // Select Option
            if (tarjetaSelect) {
                const option = document.createElement('option');
                option.value = card.id;
                option.textContent = `${card.nombre} (${card.propietario})`;
                tarjetaSelect.appendChild(option);
            }
        });
    };

    const loadCardMovements = () => {
        if (!cardTableBody) return;
        
        let cards = JSON.parse(localStorage.getItem('cards')) || [];
        let cardMovements = JSON.parse(localStorage.getItem('card_movements')) || [];
        
        // Filter out movements with invalid cards just in case
        cardTableBody.innerHTML = '';
        
        [...cardMovements].reverse().forEach((mov) => {
            const card = cards.find(c => c.id == mov.tarjeta_id);
            if (!card) return; // Skip if card was deleted or is missing

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
    loadCards();
    loadCardMovements();

    // Handle New Card Registration
    if (masterCardForm) {
        masterCardForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const tipo = document.getElementById('tipo_tarjeta').value;
            const nombre = document.getElementById('nombre_tarjeta').value;
            const propietario = document.getElementById('propietario_tarjeta').value;
            const dia_cierre = document.getElementById('dia_cierre').value;

            const newCard = {
                id: Date.now(),
                tipo,
                nombre,
                propietario,
                dia_cierre
            };

            let cards = JSON.parse(localStorage.getItem('cards')) || [];
            cards.push(newCard);
            localStorage.setItem('cards', JSON.stringify(cards));

            loadCards(); // Refresh table and select
            masterCardForm.reset();
        });
    }

    // Handle New Consumption Registration
    if (cardMovementForm) {
        cardMovementForm.addEventListener('submit', (e) => {
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
                id: Date.now(),
                tarjeta_id,
                fecha_consumo,
                cuotas,
                concepto,
                monto
            };

            let cardMovements = JSON.parse(localStorage.getItem('card_movements')) || [];
            cardMovements.push(newMovement);
            localStorage.setItem('card_movements', JSON.stringify(cardMovements));

            loadCardMovements();

            // Reset only consumption fields
            document.getElementById('concepto_tarjeta').value = '';
            document.getElementById('monto_tarjeta').value = '';
            document.getElementById('concepto_tarjeta').focus();
        });
    }

});
