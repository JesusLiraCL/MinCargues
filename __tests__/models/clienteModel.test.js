const clienteModel = require('../../src/models/clienteModel');
const db = require('../../src/config/database');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('clienteModel', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getClienteByDocumento', () => {
        it('debe devolver el cliente cuando existe', async () => {
            // Configurar el mock
            const mockCliente = {
                documento: '12345678',
                nombre: 'Empresa Ejemplo',
                direccion: 'Calle Falsa 123',
                contacto: 'Juan Perez',
                correo: 'contacto@empresa.com',
                eliminado: false
            };
            db.query.mockResolvedValueOnce({ rows: [mockCliente] });

            // Ejecutar la función
            const result = await clienteModel.getClienteByDocumento('12345678');

            // Verificar el resultado
            expect(result).toEqual(mockCliente);
            
            // Verificar la estructura de la consulta SQL
            const [query, params] = db.query.mock.calls[0];
            expect(query).toContain('SELECT * FROM clientes');
            expect(query).toContain('documento = $1');
            expect(query).toContain('eliminado = false');
            expect(params).toEqual(['12345678']);
        });

        it('debe devolver null cuando el cliente no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await clienteModel.getClienteByDocumento('INVALIDO');

            // Verificar el resultado
            expect(result).toBeNull();
        });
    });

    describe('getClientes', () => {
        it('debe devolver todos los clientes no eliminados', async () => {
            // Configurar el mock
            const mockClientes = [
                {
                    documento: '12345678',
                    nombre: 'Empresa Uno',
                    direccion: 'Dirección 1',
                    contacto: 'Contacto 1',
                    correo: 'empresa1@example.com'
                },
                {
                    documento: '87654321',
                    nombre: 'Empresa Dos',
                    direccion: 'Dirección 2',
                    contacto: 'Contacto 2',
                    correo: 'empresa2@example.com'
                }
            ];
            db.query.mockResolvedValueOnce({ rows: mockClientes });

            // Ejecutar la función
            const result = await clienteModel.getClientes();

            // Verificar el resultado
            expect(result).toEqual(mockClientes);
            
            // Verificar la estructura de la consulta SQL
            const [query] = db.query.mock.calls[0];
            const normalizedQuery = query.replace(/\s+/g, ' ').trim();
            expect(normalizedQuery).toContain('SELECT * FROM clientes WHERE eliminado = false'.replace(/\s+/g, ' '));
        });

        it('debe devolver un array vacío cuando no hay clientes', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await clienteModel.getClientes();

            // Verificar el resultado
            expect(result).toEqual([]);
        });
    });

    describe('addCliente', () => {
        it('debe agregar un nuevo cliente', async () => {
            // Configurar el mock
            const newCliente = {
                documento: '12345678',
                nombre: 'Nueva Empresa',
                direccion: 'Nueva Dirección',
                contacto: 'Nuevo Contacto',
                correo: 'nuevo@empresa.com'
            };
            db.query.mockResolvedValueOnce({ rows: [newCliente] });

            // Ejecutar la función
            const result = await clienteModel.addCliente(newCliente);

            // Verificar el resultado
            expect(result).toEqual(newCliente);
            
            // Verificar la consulta SQL
            const [query, params] = db.query.mock.calls[0];
            expect(query).toContain('INSERT INTO clientes');
            expect(query).toContain('ON CONFLICT (documento)');
            expect(params).toEqual([
                '12345678',
                'Nueva Empresa',
                'Nueva Dirección',
                'Nuevo Contacto',
                'nuevo@empresa.com'
            ]);
        });
    });

    describe('updateCliente', () => {
        it('debe actualizar un cliente existente', async () => {
            // Configurar el mock
            const updateData = {
                documento: '12345678',
                nombre: 'Empresa Actualizada',
                direccion: 'Dirección Actualizada',
                contacto: 'Contacto Actualizado',
                correo: 'actualizado@empresa.com'
            };
            db.query.mockResolvedValueOnce({ rows: [updateData] });

            // Ejecutar la función
            const result = await clienteModel.updateCliente('12345678', updateData);

            // Verificar el resultado
            expect(result).toEqual(updateData);
            
            // Verificar la consulta SQL
            const [query, params] = db.query.mock.calls[0];
            expect(query).toContain('UPDATE clientes');
            expect(query).toContain('WHERE documento = $6');
            expect(params).toEqual([
                '12345678',
                'Empresa Actualizada',
                'Dirección Actualizada',
                'Contacto Actualizado',
                'actualizado@empresa.com',
                '12345678'
            ]);
        });
    });

    describe('deleteCliente', () => {
        it('debe marcar un cliente como eliminado', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rowCount: 1 });

            // Ejecutar la función
            const result = await clienteModel.deleteCliente('12345678');

            // Verificar el resultado
            expect(result).toBe(true);
            
            // Verificar la consulta SQL
            const [query, params] = db.query.mock.calls[0];
            expect(query).toContain('UPDATE clientes SET eliminado = true');
            expect(query).toContain('WHERE documento = $1');
            expect(params).toEqual(['12345678']);
        });

        it('debe devolver false si el cliente no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rowCount: 0 });

            // Ejecutar la función
            const result = await clienteModel.deleteCliente('INVALIDO');

            // Verificar el resultado
            expect(result).toBe(false);
        });
    });
});
