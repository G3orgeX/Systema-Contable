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

    // Logout logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // In a real app, clear tokens/session here
            window.location.href = 'index.html';
        });
    }

});
