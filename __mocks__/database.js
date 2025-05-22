// Mock para la base de datos
const db = {
    query: jest.fn()
};

// Datos de prueba
const mockCargues = [
    {
        id: 1,
        placa: 'ABC123',
        conductor: 'Juan Perez',
        material: 'Arena',
        cantidad: 10,
        unidad: 'm3',
        fecha_inicio_programada: '2023-05-21 08:00:00',
        fecha_inicio_real: '2023-05-21 08:05:00',
        estado: 'en progreso'
    },
    {
        id: 2,
        placa: 'DEF456',
        conductor: 'Maria Lopez',
        material: 'Piedra',
        cantidad: 5,
        unidad: 'ton',
        fecha_inicio_programada: '2023-05-21 09:00:00',
        estado: 'pendiente'
    }
];

// Configurar el mock para devolver datos de prueba
db.query.mockImplementation((query, params) => {
    // Mock para getCarguesCompletadosHoy
    if (query.includes("estado = 'completado'")) {
        return Promise.resolve({
            rows: [{ total: '2' }]
        });
    }
    
    // Mock para getCarguesAsignadosHoy
    if (query.includes("DATE(fecha_inicio_programada)")) {
        return Promise.resolve({
            rows: [{ total: '3' }]
        });
    }
    
    // Mock para getCarguesEnCurso
    if (query.includes("estado = 'en progreso'")) {
        return Promise.resolve({
            rows: mockCargues.filter(c => c.estado === 'en progreso')
        });
    }
    
    // Mock por defecto
    return Promise.resolve({ rows: [] });
});

module.exports = db;
