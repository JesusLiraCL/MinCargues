const camionModel = require('../../src/models/camionModel');
const db = require('../../src/config/database');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('camionModel', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getTotalCamionesHabilitados', () => {
        it('debe devolver el total de camiones habilitados', async () => {
            // Configurar el mock
            const mockCount = { total: '5' };
            db.query.mockResolvedValueOnce({ rows: [mockCount] });

            // Ejecutar la función
            const result = await camionModel.getTotalCamionesHabilitados();

            // Verificar el resultado
            expect(result).toBe(5);
            
            // Verificar que se llamó a la consulta SQL con los elementos clave
            const [query] = db.query.mock.calls[0];
            expect(query).toContain('SELECT COUNT(*) as total');
            expect(query).toContain('FROM camiones');
            expect(query).toContain('habilitado = true');
            expect(query).toContain('eliminado = false');
        });

        it('debe devolver 0 si no hay camiones habilitados', async () => {
            // Configurar el mock para devolver 0
            db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

            // Ejecutar la función
            const result = await camionModel.getTotalCamionesHabilitados();

            // Verificar el resultado
            expect(result).toBe(0);
        });
    });

    describe('getCamionByPlaca', () => {
        it('debe devolver el camión cuando existe', async () => {
            // Configurar el mock
            const mockCamion = {
                placa: 'ABC123',
                tipo_camion: 'Volqueta',
                capacidad: 10,
                conductor_id: 1,
                conductor_nombre: 'Juan Perez',
                conductor_cedula: '12345678',
                conductor_edad: 30,
                conductor_telefono: '3001234567',
                conductor_correo: 'juan@example.com'
            };
            db.query.mockResolvedValueOnce({ rows: [mockCamion] });

            // Ejecutar la función
            const result = await camionModel.getCamionByPlaca('ABC123');

            // Verificar el resultado
            expect(result).toEqual(mockCamion);
            
            // Verificar la estructura de la consulta SQL
            const [query, params] = db.query.mock.calls[0];
            expect(query).toContain('SELECT c.*');
            expect(query).toContain('u.id as conductor_id');
            expect(query).toContain('u.nombre as conductor_nombre');
            expect(query).toContain('u.cedula as conductor_cedula');
            expect(query).toContain('FROM camiones c');
            expect(query).toContain('LEFT JOIN usuarios u ON c.conductor_id = u.id');
            expect(query).toContain('WHERE c.placa = $1 AND c.eliminado = false');
            expect(params).toEqual(['ABC123']);
        });
        
        it('debe devolver null cuando el camión no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await camionModel.getCamionByPlaca('INVALIDO');

            // Verificar el resultado
            expect(result).toBeNull();
        });
    });

    describe('getConductorByPlaca', () => {
        it('debe devolver el ID del conductor cuando el camión existe', async () => {
            // Configurar el mock
            const mockResult = { conductor_id: 1 };
            db.query.mockResolvedValueOnce({ rows: [mockResult] });

            // Ejecutar la función
            const result = await camionModel.getConductorByPlaca('ABC123');

            // Verificar el resultado
            expect(result).toBe(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT conductor_id FROM camiones'),
                ['ABC123']
            );
        });

        it('debe devolver null cuando el camión no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await camionModel.getConductorByPlaca('INVALIDO');

            // Verificar el resultado
            expect(result).toBeNull();
        });
    });

    describe('getCamiones', () => {
        it('debe devolver todos los camiones no eliminados', async () => {
            // Configurar el mock
            const mockCamiones = [
                { 
                    placa: 'ABC123', 
                    tipo_camion: 'Volqueta', 
                    capacidad: 10, 
                    conductor_nombre: 'Juan Perez', 
                    conductor_cedula: '12345678' 
                }
            ];
            db.query.mockResolvedValueOnce({ rows: mockCamiones });

            // Ejecutar la función
            const result = await camionModel.getCamiones();

            // Verificar el resultado
            expect(result).toEqual(mockCamiones);
            
            // Verificar la estructura de la consulta SQL
            const [query] = db.query.mock.calls[0];
            // Verificar que la consulta contiene las partes clave sin preocuparnos por el formato exacto
            const normalizedQuery = query.replace(/\s+/g, ' ').trim();
            expect(normalizedQuery).toContain('SELECT c.*, u.nombre as conductor_nombre, u.cedula as conductor_cedula'.replace(/\s+/g, ' '));
            expect(normalizedQuery).toContain('FROM camiones c'.replace(/\s+/g, ' '));
            expect(normalizedQuery).toContain('LEFT JOIN usuarios u ON c.conductor_id = u.id'.replace(/\s+/g, ' '));
            expect(normalizedQuery).toContain('WHERE c.eliminado = false'.replace(/\s+/g, ' '));
            expect(normalizedQuery).toContain('ORDER BY c.placa'.replace(/\s+/g, ' '));
        });
    });

    describe('addCamion', () => {
        it('debe agregar un nuevo camión', async () => {
            // Configurar el mock
            const newCamion = {
                placa: 'ABC123',
                tipo_camion: 'Volqueta',
                capacidad: 10,
                conductor_id: 1,
                habilitado: true
            };
            const mockResult = { rows: [{ ...newCamion, id: 1 }] };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await camionModel.addCamion(newCamion);

            // Verificar el resultado
            expect(result).toEqual(mockResult.rows[0]);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO camiones'),
                ['ABC123', 'Volqueta', 10, 1, true]
            );
        });
    });

    describe('updateCamion', () => {
        it('debe actualizar un camión existente', async () => {
            // Configurar el mock
            const updateData = {
                placa: 'ABC123',
                tipo_camion: 'Volqueta',
                capacidad: 15,
                conductor_id: 2,
                habilitado: true
            };
            const mockResult = { rows: [{ ...updateData, id: 1 }] };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await camionModel.updateCamion('ABC123', updateData);

            // Verificar el resultado
            expect(result).toEqual(mockResult.rows[0]);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE camiones'),
                ['ABC123', 'Volqueta', 15, 2, true, 'ABC123']
            );
        });
    });

    describe('deleteCamion', () => {
        it('debe marcar un camión como eliminado', async () => {
            // Configurar el mock
            const mockResult = { rowCount: 1 };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await camionModel.deleteCamion('ABC123');

            // Verificar el resultado
            expect(result).toBe(true);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE camiones SET eliminado = true'),
                ['ABC123']
            );
        });

        it('debe devolver false si el camión no existe', async () => {
            // Configurar el mock
            const mockResult = { rowCount: 0 };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await camionModel.deleteCamion('INVALIDO');

            // Verificar el resultado
            expect(result).toBe(false);
        });
    });
});
