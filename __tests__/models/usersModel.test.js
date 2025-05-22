const usersModel = require('../../src/models/usersModel');
const db = require('../../src/config/database');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('usersModel', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        it('debe devolver todos los usuarios no eliminados', async () => {
            // Configurar el mock
            const mockUsers = [
                { 
                    id: 1, 
                    nombre_usuario: 'usuario1',
                    rol: 'admin',
                    cedula: '12345678',
                    nombre: 'Usuario Uno',
                    edad: 30,
                    telefono: '1234567890',
                    correo: 'usuario1@example.com'
                }
            ];
            db.query.mockResolvedValueOnce({ rows: mockUsers });

            // Ejecutar la función
            const result = await usersModel.getUsers();

            // Verificar el resultado
            expect(result).toEqual(mockUsers);
            
            // Verificar que se llamó a la consulta SQL con los elementos clave
            const [query, params] = db.query.mock.calls[0];
            expect(query).toContain('SELECT');
            expect(query).toContain('FROM usuarios');
            expect(query).toContain('LEFT JOIN roles');
            expect(query).toContain('WHERE usuarios.eliminado = false');
            
            // Verificar que no se pasaron parámetros
            expect(params).toBeUndefined();
        });
    });

    describe('findByUsername', () => {
        it('debe devolver el usuario cuando existe', async () => {
            // Configurar el mock
            const mockUser = { 
                id: 1, 
                nombre_usuario: 'usuario1',
                // ... otros campos
            };
            db.query.mockResolvedValueOnce({ rows: [mockUser] });

            // Ejecutar la función
            const result = await usersModel.findByUsername('usuario1');

            // Verificar el resultado
            expect(result).toEqual(mockUser);
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND eliminado = false',
                ['usuario1']
            );
        });

        it('debe devolver null cuando el usuario no existe', async () => {
            // Configurar el mock
            db.query.mockResolvedValueOnce({ rows: [] });

            // Ejecutar la función
            const result = await usersModel.findByUsername('inexistente');

            // Verificar el resultado
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('debe devolver el usuario por ID', async () => {
            // Configurar el mock
            const mockUser = { id: 1, cedula: '12345678', nombre: 'Usuario Uno' };
            db.query.mockResolvedValueOnce({ rows: [mockUser] });

            // Ejecutar la función
            const result = await usersModel.findById(1);

            // Verificar el resultado
            expect(result).toEqual(mockUser);
            expect(db.query).toHaveBeenCalledWith(
                'SELECT id, cedula, nombre FROM usuarios WHERE id = $1 AND eliminado = false',
                [1]
            );
        });
    });

    describe('findByCedula', () => {
        it('debe devolver el usuario por cédula', async () => {
            // Configurar el mock
            const mockUser = { id: 1, cedula: '12345678', nombre: 'Usuario Uno' };
            db.query.mockResolvedValueOnce({ rows: [mockUser] });

            // Ejecutar la función
            const result = await usersModel.findByCedula('12345678');

            // Verificar el resultado
            expect(result).toEqual(mockUser);
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM usuarios WHERE cedula = $1 AND eliminado = false',
                ['12345678']
            );
        });
    });

    describe('createUser', () => {
        it('debe crear un nuevo usuario', async () => {
            // Datos de prueba
            const userData = {
                nombre_usuario: 'nuevo',
                cedula: '87654321',
                nombre: 'Nuevo Usuario',
                edad: 25,
                telefono: '0987654321',
                correo: 'nuevo@example.com',
                rol: 'conductor',
                contrasena: 'hashedpassword'
            };

            // Configurar los mocks
            db.query
                .mockResolvedValueOnce({ rows: [{ codigo_rol: 2 }] }) // Para la consulta del rol
                .mockResolvedValueOnce({ rows: [{ id: 2 }] }); // Para la inserción del usuario

            // Ejecutar la función
            const result = await usersModel.createUser(userData);

            // Verificar el resultado
            expect(result).toEqual({ id: 2 });
            expect(db.query).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateUser', () => {
        it('debe actualizar un usuario existente', async () => {
            // Datos de prueba
            const updateData = {
                nombre_usuario: 'usuario_actualizado',
                cedula: '11223344',
                nombre: 'Usuario Actualizado',
                edad: 35,
                telefono: '0999999999',
                correo: 'actualizado@example.com',
                rol: 'admin',
                contrasena: 'nuevopassword'
            };

            // Configurar los mocks
            db.query
                .mockResolvedValueOnce({ rows: [{ codigo_rol: 1 }] }) // Para la consulta del rol
                .mockResolvedValueOnce({ rowCount: 1 }); // Para la actualización

            // Ejecutar la función
            const result = await usersModel.updateUser('usuario1', updateData);

            // Verificar el resultado
            expect(result).toEqual({ rowCount: 1 });
            // Verificar que se realizaron las consultas esperadas
            expect(db.query).toHaveBeenNthCalledWith(
                1,
                'SELECT codigo_rol FROM roles WHERE nombre = $1',
                ['admin']
            );
            expect(db.query).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('UPDATE usuarios'),
                expect.any(Array)
            );
        });
    });

    describe('deleteUser', () => {
        it('debe marcar un usuario como eliminado', async () => {
            // Configurar el mock
            const mockResult = { rowCount: 1 };
            db.query.mockResolvedValueOnce(mockResult);

            // Ejecutar la función
            const result = await usersModel.deleteUser('usuario1');

            // Verificar el resultado
            expect(result).toEqual(mockResult);
            expect(db.query).toHaveBeenCalledWith(
                'UPDATE usuarios SET eliminado = true WHERE nombre_usuario = $1',
                ['usuario1']
            );
        });
    });
});
