const cargueModel = require('../../src/models/cargueModel');
const db = require('../../src/config/database');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('cargueModel', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getCarguesCompletadosHoy', () => {
        it('debe devolver el número de cargues completados hoy', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [{ total: '2' }] });

            // Ejecutar la función
            const result = await cargueModel.getCarguesCompletadosHoy();

            // Verificar el resultado
            expect(result).toBe(2);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("estado = 'completado'"),
                expect.any(Array)
            );
        });
    });

    describe('getCarguesAsignadosHoy', () => {
        it('debe devolver el número de cargues asignados para hoy', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [{ total: '3' }] });

            // Ejecutar la función
            const result = await cargueModel.getCarguesAsignadosHoy();

            // Verificar el resultado
            expect(result).toBe(3);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("DATE(fecha_inicio_programada)"),
                expect.any(Array)
            );
        });
    });

    describe('getCarguesEnCurso', () => {
        it('debe devolver los cargues en curso para hoy', async () => {
            // Datos de prueba
            const mockCarguesEnCurso = [
                {
                    id: 1,
                    placa: 'ABC123',
                    conductor: 'Juan Perez',
                    material: 'Arena',
                    cantidad: 10,
                    unidad: 'm3',
                    fecha_inicio_programada: '21-05-2023 08:00',
                    fecha_inicio_real: '21-05-2023 08:05'
                }
            ];

            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: mockCarguesEnCurso });

            // Ejecutar la función
            const result = await cargueModel.getCarguesEnCurso();

            // Verificar el resultado
            expect(result).toEqual(mockCarguesEnCurso);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("estado = 'en progreso'"),
                expect.any(Array)
            );
        });
    });

    describe('getCargueDetails', () => {
        it('debe devolver los detalles de un cargue específico', async () => {
            // Datos de prueba
            const mockCargue = {
                id: 1,
                placa: 'ABC123',
                // ... otros campos
            };

            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [mockCargue] });

            // Ejecutar la función
            const result = await cargueModel.getCargueDetails(1);

            // Verificar el resultado
            expect(result).toEqual(mockCargue);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                [1]
            );
        });
    });

    describe('deleteCargue', () => {
        it('debe eliminar un cargue existente', async () => {
            // Configurar el mock
            const mockResult = { rowCount: 1 };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await cargueModel.deleteCargue(1);

            // Verificar el resultado
            expect(result).toEqual(mockResult);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE'),
                [1]
            );
        });

        it('debe devolver rowCount: 0 si el cargue no existe', async () => {
            // Configurar el mock
            const mockResult = { rowCount: 0 };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await cargueModel.deleteCargue(999);

            // Verificar el resultado
            expect(result).toEqual(mockResult);
        });
    });
});
