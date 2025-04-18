import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    getDay,
    addDays
} from 'https://cdn.jsdelivr.net/npm/date-fns@2.29.3/esm/index.js';

document.addEventListener('DOMContentLoaded', async function () {

    console.log(format(new Date(), 'yyyy-MM-dd'));

    // Configuración inicial
    const state = {
        currentDate: new Date(),
        selectedDate: null,
        actividades: window.carguesCalendario || {},
    };

    // Elementos del DOM
    const elementos = {
        calendario: document.getElementById('calendario'),
        mesActual: document.getElementById('mes-actual'),
        prevMonth: document.getElementById('prev-month'),
        nextMonth: document.getElementById('next-month'),
        diaSeleccionado: document.getElementById('dia-seleccionado'),
        listaActividades: document.getElementById('lista-actividades')
    };

    // Nombres de días
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Meses en español
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Inicializar
    function init() {
        state.selectedDate = new Date();
        renderCalendario();
        mostrarActividades(state.selectedDate);
        setupEventListeners();
    }

    // Renderizar calendario
    function renderCalendario() {
        elementos.calendario.innerHTML = '';

        // Encabezado con mes y año
        elementos.mesActual.textContent = `${meses[state.currentDate.getMonth()]} ${state.currentDate.getFullYear()}`;

        // Días de la semana
        diasSemana.forEach(dia => {
            const diaEl = document.createElement('div');
            diaEl.className = 'dia-semana';
            diaEl.textContent = dia;
            elementos.calendario.appendChild(diaEl);
        });

        // Días del mes
        const primerDiaMes = startOfMonth(state.currentDate);
        const ultimoDiaMes = endOfMonth(state.currentDate);

        // Espacios vacíos al inicio
        const diaInicioSemana = getDay(primerDiaMes);
        for (let i = 0; i < diaInicioSemana; i++) {
            elementos.calendario.appendChild(createDiaElement(null));
        }

        // Días del mes
        const diasMes = eachDayOfInterval({
            start: primerDiaMes,
            end: ultimoDiaMes
        });

        diasMes.forEach(dia => {
            elementos.calendario.appendChild(createDiaElement(dia));
        });
    }

    // Crear elemento día
    function createDiaElement(date) {
        const diaEl = document.createElement('div');

        if (!date) {
            diaEl.className = 'dia otro-mes';
            return diaEl;
        }

        diaEl.className = 'dia';
        diaEl.textContent = date.getDate();

        // Resaltar día actual (aunque no esté seleccionado)
        if (isSameDay(date, new Date())) {
            diaEl.classList.add('hoy');
        }

        // Resaltar día seleccionado
        if (state.selectedDate && isSameDay(date, state.selectedDate)) {
            diaEl.classList.add('seleccionado');
        }

        // Nivel de actividad
        const fechaStr = format(date, 'yyyy-MM-dd');
        const actividades = state.actividades[fechaStr] || [];
        const nivel = Math.min(Math.ceil(actividades.length / 2), 5);
        if (nivel > 0) diaEl.classList.add(`nivel-${nivel}`);

        // Evento click
        diaEl.addEventListener('click', () => {
            state.selectedDate = date;
            renderCalendario();
            mostrarActividades(date);
        });

        return diaEl;
    }

    // Mostrar actividades
    function mostrarActividades(date) {
        const fechaStr = format(date, 'yyyy-MM-dd');
        elementos.diaSeleccionado.textContent = isSameDay(date, new Date())
            ? 'Cargues para hoy:'
            : `Cargues para ${format(date, 'dd/MM/yyyy')}`;

        const contenedor = document.getElementById('lista-actividades');
        contenedor.innerHTML = '';

        const actividades = state.actividades[fechaStr] || [];

        if (actividades.length === 0) {
            contenedor.innerHTML = '<p>No hay actividades programadas</p>';
            return;
        }

        const tabla = document.createElement('table');
        tabla.className = 'tabla-actividades';

        // SOLO TBODY - SIN HEADER
        const tbody = document.createElement('tbody');

        actividades.forEach(actividad => {
            const tr = document.createElement('tr');

            // Columnas: Conductor, Camión, Material, Hora
            ['conductor', 'camion', 'material', 'hora'].forEach(campo => {
                const td = document.createElement('td');
                td.textContent = actividad[campo];
                td.title = actividad[campo]; // Tooltip para contenido largo
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        tabla.appendChild(tbody);
        contenedor.appendChild(tabla);
    }

    // Datos de ejemplo
    function generarDatosEjemplo() {
        const datos = {};
        const hoy = new Date();

        // Nombres de ejemplo para datos realistas
        const conductores = ['Juan Pérez', 'Carlos Gómez', 'Ana Rodríguez', 'Luis Martínez'];
        const camiones = ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'];
        const materiales = ['Arena', 'Grava', 'Cemento', 'Piedra', 'Adoquines'];

        // Primeros 8 días con actividades garantizadas
        for (let i = 0; i < 8; i++) {
            const fecha = addDays(hoy, i);
            const fechaStr = format(fecha, 'yyyy-MM-dd');

            // Número de actividades para este día (entre 1 y 4)
            const numActividades = Math.max(1, Math.floor(Math.random() * 10));

            datos[fechaStr] = [];
            for (let j = 0; j < numActividades; j++) {
                datos[fechaStr].push({
                    conductor: conductores[Math.floor(Math.random() * conductores.length)],
                    camion: camiones[Math.floor(Math.random() * camiones.length)],
                    material: materiales[Math.floor(Math.random() * materiales.length)],
                    hora: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
                });
            }
        }

        // Resto del mes con actividades aleatorias
        for (let i = 8; i < 30; i++) {
            const fecha = addDays(hoy, i);
            const fechaStr = format(fecha, 'yyyy-MM-dd');
            const numActividades = Math.floor(Math.random() * 4); // 0-3 actividades

            if (numActividades > 0) {
                datos[fechaStr] = [];
                for (let j = 0; j < numActividades; j++) {
                    datos[fechaStr].push({
                        conductor: conductores[Math.floor(Math.random() * conductores.length)],
                        camion: camiones[Math.floor(Math.random() * camiones.length)],
                        material: materiales[Math.floor(Math.random() * materiales.length)],
                        hora: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
                    });
                }
            }
        }

        return datos;
    }

    function setupEventListeners() {
        elementos.prevMonth.addEventListener('click', () => {
            state.currentDate = subMonths(state.currentDate, 1);
            renderCalendario();
        });

        elementos.nextMonth.addEventListener('click', () => {
            state.currentDate = addMonths(state.currentDate, 1);
            renderCalendario();
        });
    }

    // Iniciar
    init();
});