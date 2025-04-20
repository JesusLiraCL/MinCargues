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

    // Función para mostrar el popup
    function showCarguePopup(rowData) {
        const popup = document.createElement('div');
        popup.className = 'cargue-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <h3>Detalles del Cargue</h3>
                <ul>
                    <li>ID: ${rowData.id}</li>
                    <li>Placa: ${rowData.placa}</li>
                    <li>Conductor: ${rowData.conductor}</li>
                    <li>Material: ${rowData.material}</li>
                    <li>Cantidad: ${rowData.cantidad} ${rowData.unidad || ''}</li>
                    <li>Cliente: ${rowData.cliente}</li>
                    <li>Fecha Inicio Programada: ${rowData.fecha_inicio_programada}</li>
                </ul>
                <button class="close-popup">Cerrar</button>
            </div>
        `;

        document.body.appendChild(popup);

        popup.querySelector('.close-popup').addEventListener('click', () => {
            popup.remove();
        });

        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });

        // Estilos CSS para el popup
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        popup.querySelector('.popup-content').style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
        `;
        popup.querySelector('.close-popup').style.cssText = `
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        `;
    }

    function initializeDblClickEvents() {
        console.log("dbClick registrado");
        const tbody = dynamicTable.querySelector('tbody');
        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('dblclick', async function (e) {
                const id = this.cells[0].textContent;
                // Simplemente muestra un mensaje con el ID
                await window.popupManager.showPopup(`
                    <div class="popup-content">
                        <h3>ID: ${id}</h3>
                        <p>Detalles del cargue</p>
                    </div>
                `);
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
