document.addEventListener('DOMContentLoaded', function () {
    // Main DynamicTable class
    class DynamicTable {
        constructor(tableElement, options = {}) {
            this.table = tableElement;
            this.searchInput = options.searchInput || document.getElementById('dynamic-table-search');
            this.searchButton = options.searchButton || document.getElementById('dynamic-table-search-button');
            this.initialData = options.initialData || [];
            this.config = options.config || {};
            
            this.currentSort = { column: this.config.defaultSortColumn || '', direction: 'asc' };
            this.originalData = [];
            this.filteredData = [];
            
            this.initialize();
        }
        
        initialize() {
            // Set up initial data
            this.originalData = [...this.initialData];
            this.filteredData = [...this.originalData];
            
            // Set default sort if configured
            if (this.config.defaultSortColumn) {
                this.currentSort.column = this.config.defaultSortColumn;
                this.sortData();
            }
            
            // Render the table
            this.renderTable();
            
            // Set up event listeners
            this.setupEventListeners();
        }
        
        setupEventListeners() {
            // Sortable headers
            const sortableHeaders = this.table.querySelectorAll('th[data-sort]');
            sortableHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.dataset.sort;
                    this.handleSort(column);
                });
            });
            
            // Search functionality
            if (this.searchButton) {
                this.searchButton.addEventListener('click', () => this.performSearch());
            }
            
            if (this.searchInput) {
                this.searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performSearch();
                    }
                });
            }
        }
        
        handleSort(column) {
            if (this.currentSort.column === column) {
                this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.currentSort.column = column;
                this.currentSort.direction = 'asc';
            }
            
            this.sortData();
            this.renderTable();
        }
        
        sortData() {
            if (!this.currentSort.column) return;
            
            this.filteredData.sort((a, b) => {
                let aValue = a[this.currentSort.column];
                let bValue = b[this.currentSort.column];
                
                // Custom sort handling if configured
                if (this.config.customSortHandlers && this.config.customSortHandlers[this.currentSort.column]) {
                    return this.config.customSortHandlers[this.currentSort.column](aValue, bValue, this.currentSort.direction);
                }
                
                // Default date handling (similar to your original)
                if (this.currentSort.column === 'fecha_inicio_programada') {
                    const datePartA = aValue ? aValue.split(' ')[0] : '';
                    const datePartB = bValue ? bValue.split(' ')[0] : '';
                    
                    aValue = datePartA ? new Date(datePartA.split('-').reverse().join('-')) : 0;
                    bValue = datePartB ? new Date(datePartB.split('-').reverse().join('-')) : 0;
                }
                
                if (aValue < bValue) {
                    return this.currentSort.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return this.currentSort.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        performSearch() {
            const searchTerm = this.searchInput.value.toLowerCase();
            
            if (searchTerm === '') {
                this.filteredData = [...this.originalData];
            } else {
                this.filteredData = this.originalData.filter(row =>
                    Object.values(row).some(value =>
                        String(value).toLowerCase().includes(searchTerm)
                    )
                );
            }
            
            this.sortData();
            this.renderTable();
        }
        
        renderTable() {
            const tbody = this.table.querySelector('tbody');
            tbody.innerHTML = '';
            
            // Get all column definitions from the table headers
            const columnDefinitions = this.getColumnDefinitions();
            
            this.filteredData.forEach(row => {
                const tr = document.createElement('tr');
                
                // Add double click handler if configured
                if (this.config.rowDoubleClick) {
                    tr.addEventListener('dblclick', () => this.config.rowDoubleClick(row));
                }
                
                // Render each column
                columnDefinitions.forEach(colDef => {
                    const td = document.createElement('td');
                    const columnName = colDef.dataColumn;
                    let value = columnName ? row[columnName] : '';
                    
                    // 1. Primero verifica si hay un columnRenderer específico
                    if (this.config.columnRenderers && columnName && this.config.columnRenderers[columnName]) {
                        this.config.columnRenderers[columnName].render(td, value, row);
                        tr.appendChild(td);
                        return; // Salimos de esta iteración para evitar sobrescritura
                    }
                    
                    // 2. Luego verifica los customRenderers existentes
                    if (colDef.customRenderer) {
                        colDef.customRenderer(td, row);
                        tr.appendChild(td);
                        return;
                    }
                    
                    // 3. Finalmente, el renderizado por defecto
                    // Set data attribute for identification
                    if (colDef.dataColumn) {
                        td.setAttribute('data-column', colDef.dataColumn);
                    }
                    
                    // Special handling for estado column
                    if (colDef.dataColumn === 'estado') {
                        td.className = `dynamic-table-estado ${value ? 'estado-' + value.toLowerCase().replace(/\s/g, '-') : ''}`;
                        td.textContent = '';
                        td.title = value;
                    } else {
                        // Handle combined fields like cantidad + unidad
                        if (colDef.dataColumn === 'cantidad' && row.unidad) {
                            value = value + ' ' + row.unidad;
                        }
                        
                        td.textContent = value;
                        td.title = value;
                    }
                    
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
            
            this.updateSortIcons();
        }
        
        getColumnDefinitions() {
            const headers = this.table.querySelectorAll('thead th');
            const columnDefinitions = [];
            
            headers.forEach(header => {
                const colDef = {
                    headerText: header.textContent.trim(),
                    dataColumn: header.dataset.sort || null,
                    isSortable: header.hasAttribute('data-sort')
                };
                
                // Add custom renderers for special columns
                if (header.classList.contains('columna-estado')) {
                    colDef.dataColumn = 'estado';
                } else if (header.textContent.trim() === 'Inicio Prog.' && !header.dataset.sort) {
                    // Special handling for the time part of fecha_inicio_programada
                    colDef.customRenderer = (td, row) => {
                        if (row.fecha_inicio_programada) {
                            const [, hora24] = row.fecha_inicio_programada.split(' ');
                            if (hora24) {
                                const hora = new Date(`2000-01-01T${hora24}`);
                                const hora12 = hora.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }).toLowerCase();
                                td.textContent = hora12;
                                td.title = hora24;
                            }
                        }
                    };
                } else if (header.dataset.sort === 'fecha_inicio_programada') {
                    // Special handling for the date part of fecha_inicio_programada
                    colDef.customRenderer = (td, row) => {
                        if (row.fecha_inicio_programada) {
                            const [fecha] = row.fecha_inicio_programada.split(' ');
                            td.textContent = fecha;
                            td.title = fecha;
                        }
                    };
                }
                
                columnDefinitions.push(colDef);
            });
            
            return columnDefinitions;
        }
        
        updateSortIcons() {
            const sortableHeaders = this.table.querySelectorAll('th[data-sort]');
            
            sortableHeaders.forEach(header => {
                const icon = header.querySelector('.table-sort-icon') || document.createElement('span');
                icon.className = 'table-sort-icon';
                icon.innerHTML = '';
                
                if (header.dataset.sort === this.currentSort.column) {
                    icon.innerHTML = this.currentSort.direction === 'asc' ? '↑' : '↓';
                }
                
                if (!header.querySelector('.table-sort-icon')) {
                    header.appendChild(icon);
                }
            });
        }
        
        // Public method to update data
        updateData(newData) {
            this.originalData = [...newData];
            this.filteredData = [...this.originalData];
            this.sortData();
            this.renderTable();
        }
    }

    // Initialize tables based on their configuration
    function initializeTables() {
        // Example for your carguesCalendario table
        if (window.carguesCalendario) {
            const carguesTable = document.querySelector('.dynamic-cargue-table');
            if (carguesTable) {
                new DynamicTable(carguesTable, {
                    initialData: window.carguesCalendario,
                    searchInput: document.getElementById('dynamic-table-search'),
                    searchButton: document.getElementById('dynamic-table-search-button'),
                    config: {
                        defaultSortColumn: 'fecha_inicio_programada',
                        rowDoubleClick: (row) => {
                            if (row.id) {
                                window.location.href = `/admin/cargue/${row.id}?referrer=calendario-admin`;
                            }
                        },
                        customSortHandlers: {
                            // You can add custom sort handlers for specific columns if needed
                        }
                    }
                });
            }
        }
        
        if (window.registerData) {
            const carguesTable = document.querySelector('.dynamic-cargue-table');
            if (carguesTable) {
                new DynamicTable(carguesTable, {
                    initialData: window.registerData,
                    searchInput: document.getElementById('dynamic-table-search'),
                    searchButton: document.getElementById('dynamic-table-search-button'),
                    config: {
                        defaultSortColumn: 'fecha_inicio_programada',
                        rowDoubleClick: (row) => {
                            if (row.id) {
                                window.location.href = `/admin/cargue/${row.id}?referrer=registro`;
                            }
                        },
                    }
                });
            }
        }
        
        if(window.usersData){
            const usersTable = document.querySelector('.dynamic-cargue-table');
            if (usersTable) {
                new DynamicTable(usersTable, {
                    initialData: window.usersData,
                    searchInput: document.getElementById('dynamic-table-search'),
                    searchButton: document.getElementById('dynamic-table-search-button'),
                    config: {
                        defaultSortColumn: 'rol',
                        rowDoubleClick: (rowData) => {
                            if (rowData.cedula) {
                                openUserModalWithData({
                                    nombre_usuario: rowData.nombre_usuario,
                                    rol: rowData.rol,
                                    cedula: rowData.cedula,
                                    nombre: rowData.nombre,
                                    telefono: rowData.telefono,
                                    edad: rowData.edad,
                                    correo: rowData.correo
                                });
                            } else {
                                console.error('No se encontró cédula en los datos de la fila');
                            }
                        }
                    }
                });
            }
        }
        
        if(window.trucksData){
            const trucksTable = document.querySelector('.dynamic-cargue-table');
            if (trucksTable) {
                new DynamicTable(trucksTable, {
                    initialData: window.trucksData,
                    searchInput: document.getElementById('dynamic-table-search'),
                    searchButton: document.getElementById('dynamic-table-search-button'),
                    config: {
                        defaultSortColumn: 'tipo_camion',
                        columnRenderers: {
                            habilitado: {
                                render: (td, value) => {
                                    if (value) {
                                        td.innerHTML = '<i class="fas fa-check-circle" style="color: #356adc; font-size: 1.2em"></i>';
                                        td.title = 'Habilitado';
                                    } else {
                                        td.innerHTML = '<i class="fas fa-times-circle" style="color: #dc3545; font-size: 1.2em"></i>';
                                        td.title = 'No habilitado';
                                    }
                                    td.style.textAlign = 'center';
                                }
                            }
                        },
                        rowDoubleClick: (rowData) => {
                            if (rowData.placa) {
                                openTruckModalWithData({
                                    placa: rowData.placa,
                                    tipo_camion: rowData.tipo_camion,
                                    capacidad: rowData.capacidad,
                                    conductor_cedula: rowData.conductor_cedula,
                                    habilitado: rowData.habilitado
                                });
                            }
                        }
                    }
                });
            }
        }

        if(window.clientsData){
            const clientsTable = document.querySelector('.dynamic-cargue-table');
            if (clientsTable) {
                new DynamicTable(clientsTable, {
                    initialData: window.clientsData,
                    searchInput: document.getElementById('dynamic-table-search'),
                    searchButton: document.getElementById('dynamic-table-search-button'),
                    config: {
                        defaultSortColumn: 'nombre',
                        rowDoubleClick: (rowData) => {
                            if (rowData.documento) {
                                openClientModalWithData({
                                    documento: rowData.documento,
                                    nombre: rowData.nombre,
                                    direccion: rowData.direccion,
                                    contacto: rowData.contacto,
                                    correo: rowData.correo
                                });
                            } else {
                                console.error('No se encontró documento en los datos de la fila');
                            }
                        }
                    }
                });
            }
        }

        if(window.materialsData){
            const materialsTable = document.querySelector('.dynamic-cargue-table');
            if (materialsTable) {
                new DynamicTable(materialsTable, {
                    initialData: window.materialsData,
                    searchInput: document.getElementById('dynamic-table-search'),
                    searchButton: document.getElementById('dynamic-table-search-button'),
                    config: {
                        defaultSortColumn: 'codigo',
                        rowDoubleClick: (rowData) => {
                            if (rowData.codigo) {
                                openMaterialModalWithData({
                                    codigo: rowData.codigo,
                                    nombre: rowData.nombre,
                                    unidad_medida: rowData.unidad_medida
                                });
                            }
                        }
                    }
                });
            }
        }
    }

    // Initialize all tables on the page
    initializeTables();
});