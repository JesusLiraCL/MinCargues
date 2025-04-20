document.addEventListener('DOMContentLoaded', function () {
    const dynamicTable = document.querySelector('.dynamic-cargue-table');
    const dynamicHeaders = dynamicTable.querySelectorAll('th[data-sort]');
    const dynamicSearchInput = document.getElementById('dynamic-table-search');
    let currentSort = { column: 'inicio-prog', direction: 'asc' };
    let originalData = [];
    let filteredData = [];

    // Obtener datos iniciales
    function fetchData() {
        originalData = window.carguesCalendario || [];
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
        const columnas = [
            'estado',
            'id',
            'placa',
            'conductor',
            'material',
            'cantidad',
            'cliente',
            'fecha_inicio_programada',
        ];

        const tbody = dynamicTable.querySelector('tbody');
        tbody.innerHTML = '';

        filteredData.forEach(row => {
            const tr = document.createElement('tr');
            columnas.forEach(key => {
                const td = document.createElement('td');
                let valor = row[key];

                if (key === 'estado') {
                    td.className = `dynamic-table-estado ${valor ? 'estado-' + valor.toLowerCase().replace(/\s/g, '-') : ''}`;
                    td.textContent = '';
                    td.title = valor;
                } else {
                    if (key === 'cantidad' && row.unidad) {
                        valor = valor + ' ' + row.unidad;
                    }
                    td.textContent = valor;
                    td.title = valor;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // Actualizar iconos de ordenamiento
        dynamicHeaders.forEach(header => {
            const icon = header.querySelector('.table-sort-icon') || document.createElement('span');
            icon.className = 'table-sort-icon';
            icon.innerHTML = '';

            if (header.dataset.sort === currentSort.column) {
                icon.innerHTML = currentSort.direction === 'asc' ? '↑' : '↓';
            }

            if (!header.querySelector('.table-sort-icon')) {
                header.appendChild(icon);
            }
        });

        initializeDblClickEvents();
    }

    function initializeDblClickEvents() {
        const tbody = dynamicTable.querySelector('tbody');
        
        if (!tbody) {
            console.error('No se encontró el tbody');
            return;
        }
    
        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('dblclick', function(e) {
                const id = this.cells[1].textContent;
                if (id) {
                    // Redirigir a la página de detalles
                    window.location.href = `/admin/cargue/${id}`;
                } else {
                    console.error('No se pudo obtener el ID del cargue');
                }
            });
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

    function performSearch() {
        const searchTerm = dynamicSearchInput.value.toLowerCase();

        if (searchTerm === '') {
            filteredData = [...originalData];
        } else {
            filteredData = originalData.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(searchTerm)
                )
            );
        }

        sortData();
        renderTable();
    }
    const dynamicSearchButton = document.getElementById('dynamic-table-search-button');
    dynamicSearchButton.addEventListener('click', performSearch);

    // Búsqueda al presionar Enter en el input
    dynamicSearchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Inicializar
    fetchData();
});     
