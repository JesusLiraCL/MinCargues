const materialModel = require('../../src/models/materialModel');
const db = require('../../src/config/database');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('materialModel', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getMaterialCodeByName', () => {
        it('debe devolver el código del material cuando existe', async () => {
            // Configurar el mock
            const mockMaterial = { codigo: 'MAT001' };
            db.query.mockResolvedValueOnce({ rows: [mockMaterial] });

            // Ejecutar la función
            const result = await materialModel.getMaterialCodeByName('Arena');

            // Verificar el resultado
            expect(result).toBe('MAT001');
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT codigo FROM materiales'),
                ['Arena']
            );
        });

        it('debe devolver null cuando el material no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await materialModel.getMaterialCodeByName('Inexistente');

            // Verificar el resultado
            expect(result).toBeNull();
        });
    });

    describe('getAllMaterials', () => {
        it('debe devolver todos los materiales no eliminados', async () => {
            // Configurar el mock
            const mockMaterials = [
                { codigo: 'MAT001', nombre: 'Arena', unidad_medida: 'm3' },
                { codigo: 'MAT002', nombre: 'Piedra', unidad_medida: 'ton' }
            ];
            db.query.mockResolvedValueOnce({ rows: mockMaterials });

            // Ejecutar la función
            const result = await materialModel.getAllMaterials();

            // Verificar el resultado
            expect(result).toEqual(mockMaterials);
            
            // Verificar que se llamó a la consulta SQL con los elementos clave
            const [query] = db.query.mock.calls[0];
            expect(query).toContain('SELECT codigo, nombre, unidad_medida');
            expect(query).toContain('FROM materiales');
            expect(query).toContain('WHERE eliminado = false');
            expect(query).toContain('ORDER BY codigo');
            
            // Verificar que no se pasó un segundo parámetro
            expect(db.query.mock.calls[0].length).toBe(1);
        });

        it('debe manejar errores y devolver un array vacío', async () => {
            // Configurar el mock para que falle
            db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Espiar en console.error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Ejecutar la función
            const result = await materialModel.getAllMaterials();

            // Verificar el resultado
            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            
            // Limpiar el spy
            consoleSpy.mockRestore();
        });
    });

    describe('getMaterialByCodigo', () => {
        it('debe devolver el material cuando existe', async () => {
            // Configurar el mock
            const mockMaterial = { 
                codigo: 'MAT001', 
                nombre: 'Arena', 
                unidad_medida: 'm3' 
            };
            db.query.mockResolvedValueOnce({ rows: [mockMaterial] });

            // Ejecutar la función
            const result = await materialModel.getMaterialByCodigo('MAT001');

            // Verificar el resultado
            expect(result).toEqual(mockMaterial);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM materiales'),
                ['MAT001']
            );
        });

        it('debe devolver null cuando el material no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await materialModel.getMaterialByCodigo('INVALIDO');

            // Verificar el resultado
            expect(result).toBeNull();
        });
    });

    describe('addMaterial', () => {
        it('debe agregar un nuevo material', async () => {
            // Configurar el mock
            const newMaterial = { 
                nombre: 'Grava', 
                unidad_medida: 'm3' 
            };
            const mockResult = { rows: [{ codigo: 'MAT003' }] };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await materialModel.addMaterial(newMaterial);

            // Verificar el resultado
            expect(result).toEqual(mockResult.rows[0]);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO materiales'),
                ['Grava', 'm3']
            );
        });
    });

    describe('updateMaterial', () => {
        it('debe actualizar un material existente', async () => {
            // Configurar el mock
            const updateData = { 
                nombre: 'Arena Fina', 
                unidad_medida: 'm3' 
            };
            const mockResult = { rows: [{ /* datos del material actualizado */ }] };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await materialModel.updateMaterial('MAT001', updateData);

            // Verificar el resultado
            expect(result).toEqual(mockResult.rows[0]);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE materiales'),
                ['Arena Fina', 'm3', 'MAT001']
            );
        });
    });

    describe('deleteMaterial', () => {
        it('debe marcar un material como eliminado', async () => {
            // Configurar el mock
            const mockResult = { rowCount: 1 };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await materialModel.deleteMaterial('MAT001');

            // Verificar el resultado
            expect(result).toBe(true);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE materiales SET eliminado = true'),
                ['MAT001']
            );
        });
    });
});
