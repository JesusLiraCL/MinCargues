document.addEventListener('DOMContentLoaded', function () {
    const dynamicTable = document.getElementById('dynamic-cargue-table');
    const dynamicHeaders = dynamicTable.querySelectorAll('th[data-sort]');
    const dynamicSearchInput = document.getElementById('dynamic-table-search');
    let currentSort = { column: 'inicio-prog', direction: 'asc' };
    let originalData = [];
    let filteredData = [];

    // Obtener datos iniciales (simulados)
    function fetchData() {
        // En una implementación real, esto vendría de una llamada al backend
        originalData = [
            { id: 1, placa: 'ABC123', tipo: 'Volqueta', material: 'Arena', cantidad: 10, 'inicio-prog': '05-01 08:00 pm', 'fin-prog': '05-01 08:00 pm', estado: true, observacion: false },
            { id: 2, placa: 'DEF456', tipo: 'Tractomula', material: 'Grava', cantidad: 15, 'inicio-prog': '05-01 9:00 am', 'fin-prog': '05-01 08:00 pm', estado: false, observacion: true },
            { id: 3, placa: 'GHI789', tipo: 'Volqueta', material: 'Piedra', cantidad: 8, 'inicio-prog': '2023-05-02T07:00', 'fin-prog': '2023-05-02T09:00', estado: true, observacion: false },
            { id: 4, placa: 'JKL012', tipo: 'Camión', material: 'Arena', cantidad: 12, 'inicio-prog': '2023-05-02T10:00', 'fin-prog': '2023-05-02T13:00', estado: true, observacion: true },
            { id: 5, placa: 'MNO345', tipo: 'Tractomula', material: 'Grava', cantidad: 20, 'inicio-prog': '2023-05-03T08:00', 'fin-prog': '2023-05-03T11:00', estado: false, observacion: false }
        ];
        filteredData = [...originalData];
        sortData();
        renderTable();
    }

    // Función para ordenar datos
    function sortData() {
        filteredData.sort((a, b) => {
            const aValue = a[currentSort.column];
            const bValue = b[currentSort.column];

            if (aValue < bValue) {
                return currentSort.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return currentSort.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Función para renderizar la tabla
    function renderTable() {
        const tbody = dynamicTable.querySelector('tbody');
        tbody.innerHTML = '';

        filteredData.forEach(row => {
            const tr = document.createElement('tr');

            Object.keys(row).forEach(key => {
                const td = document.createElement('td');

                if (key === 'estado' || key === 'observacion') {
                    td.className = `dynamic-table-${key}-${row[key]}`;
                    td.textContent = row[key] ? '✔' : '✖';
                } else {
                    td.textContent = row[key];
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        // Actualizar iconos de ordenamiento
        dynamicHeaders.forEach(header => {
            const icon = header.querySelector('.dynamic-table-sort-icon') || document.createElement('span');
            icon.className = 'dynamic-table-sort-icon';
            icon.innerHTML = '';

            if (header.dataset.sort === currentSort.column) {
                icon.innerHTML = currentSort.direction === 'asc' ? '↑' : '↓';
            }

            if (!header.querySelector('.dynamic-table-sort-icon')) {
                header.appendChild(icon);
            }
        });
    }

    // Event listeners para ordenamiento
    dynamicHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;

            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            sortData();
            renderTable();
        });
    });

    // Event listener para búsqueda
    dynamicSearchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();

        if (searchTerm === '') {
            filteredData = [...originalData];
        } else {
            filteredData = originalData.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(searchTerm)
                ));
        }

        sortData();
        renderTable();
    });

    // Inicializar
    fetchData();
});