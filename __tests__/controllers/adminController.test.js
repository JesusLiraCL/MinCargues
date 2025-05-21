const adminController = require('../../src/controllers/adminController');
const cargueModel = require('../../src/models/cargueModel');
const camionModel = require('../../src/models/camionModel');
const clienteModel = require('../../src/models/clienteModel');
const materialModel = require('../../src/models/materialModel');
const usersModel = require('../../src/models/usersModel');
const bcrypt = require('bcryptjs');

// Mock de los módulos
jest.mock('../../src/models/cargueModel');
jest.mock('../../src/models/camionModel');
jest.mock('../../src/models/clienteModel');
jest.mock('../../src/models/materialModel');
jest.mock('../../src/models/usersModel');

describe('Admin Controller', () => {
    let req, res, next;

    beforeEach(() => {
        // Configuración inicial para cada prueba
        req = {
            body: {},
            params: {},
            user: { id: 1, rol: 'admin' },
            flash: jest.fn().mockImplementation((type) => type === 'success_msg' ? ['test message'] : [])
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();

        // Configuración común de mocks
        res.redirect.mockImplementation(() => res);
        res.render.mockImplementation(() => res);
        res.status.mockImplementation(() => res);
        res.json.mockImplementation(() => res);

        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getDashboardData', () => {
        it('debe renderizar el dashboard con los datos correctos', async () => {
            // Mock de datos para las estadísticas
            camionModel.getTotalCamionesHabilitados.mockResolvedValue(10);
            cargueModel.getCarguesCompletadosHoy.mockResolvedValue(5);
            cargueModel.getCarguesAsignadosHoy.mockResolvedValue(8);

            // Mock para cargues en curso (debe ser un array de objetos)
            cargueModel.getCarguesEnCurso.mockResolvedValue([
                { placa: 'ABC123' },
                { placa: 'DEF456' }
            ]);

            // Mock para cargues pendientes
            cargueModel.getCarguesPendientesHoy.mockResolvedValue([
                {
                    id: 1,
                    placa: 'ABC123',
                    conductor: 'Conductor 1',
                    material: 'Material 1',
                    cantidad: 10,
                    inicio_programado: '08:00',
                    fin_programado: '10:00'
                }
            ]);

            await adminController.getDashboardData(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/inicioAdmin',
                expect.objectContaining({
                    layout: 'main',
                    title: 'Inicio',
                    user: req.user,
                    stats: {
                        totalCamiones: 10,
                        carguesCompletados: 5,
                        carguesAsignados: 8,
                        camionesEnUso: 2
                    },
                    progress: expect.any(Number),
                    truckUsage: expect.any(Number)
                })
            );
        });
    });

    describe('postAddUser', () => {
        it('debe agregar un nuevo usuario correctamente', async () => {
            // Configurar la solicitud
            req.body = {
                nombre_usuario: 'nuevo_usuario',
                cedula: '12345678',
                nombre: 'Nuevo Usuario',
                edad: '30',
                telefono: '1234567890',
                correo: 'nuevo@ejemplo.com',
                rol: 'admin',
                contrasena: 'password123'
            };

            // Configurar los mocks
            usersModel.findByUsername = jest.fn().mockResolvedValue(null);
            usersModel.findByCedula = jest.fn().mockResolvedValue(null);
            bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');
            usersModel.createUser = jest.fn().mockResolvedValue({ id: 1 });

            // Llamar al controlador
            await adminController.postAddUser(req, res);

            // Verificar que se llamó a createUser con los parámetros correctos
            expect(usersModel.createUser).toHaveBeenCalledWith({
                nombre_usuario: 'nuevo_usuario',
                cedula: '12345678',
                nombre: 'Nuevo Usuario',
                edad: '30',
                telefono: '1234567890',
                correo: 'nuevo@ejemplo.com',
                rol: 'admin',
                contrasena: 'hashedPassword'
            });

            // Verificar la respuesta exitosa
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                redirect: '/admin/usuarios'
            });
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Usuario creado exitosamente');
        });

        it('debe manejar el caso cuando el nombre de usuario ya existe', async () => {
            // Configurar la solicitud
            req.body = {
                nombre_usuario: 'usuario_existente',
                cedula: '12345678',
                nombre: 'Usuario Existente',
                edad: '30',
                telefono: '1234567890',
                correo: 'existente@ejemplo.com',
                rol: 'user',
                contrasena: 'password123'
            };

            // Configurar el mock para simular que el nombre de usuario ya existe
            usersModel.findByUsername = jest.fn().mockResolvedValue({ id: 1 });

            // Llamar al controlador
            await adminController.postAddUser(req, res);

            // Verificar la respuesta de error
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ya existe un usuario con este nombre de usuario',
                field: 'nombre_usuario'
            });
        });

        it('debe manejar el caso cuando la cédula ya existe', async () => {
            // Configurar la solicitud
            req.body = {
                nombre_usuario: 'nuevo_usuario',
                cedula: '12345678',
                nombre: 'Nuevo Usuario',
                edad: '30',
                telefono: '1234567890',
                correo: 'nuevo@ejemplo.com',
                rol: 'admin',
                contrasena: 'password123'
            };

            // Configurar los mocks
            usersModel.findByUsername = jest.fn().mockResolvedValue(null);
            usersModel.findByCedula = jest.fn().mockResolvedValue({ id: 1 });

            // Llamar al controlador
            await adminController.postAddUser(req, res);

            // Verificar la respuesta de error
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ya existe un usuario con esta cédula',
                field: 'cedula'
            });
        });
    });

    describe('postAddTruck', () => {
        it('debe agregar un nuevo camión correctamente', async () => {
            // Configurar la solicitud
            req.body = {
                placa: 'ABC123',
                modelo: 'Modelo 2023',
                capacidad: '10',
                estado: 'disponible',
                activo: true
            };

            // Configurar los mocks
            camionModel.getCamionByPlaca = jest.fn().mockResolvedValue(null);
            camionModel.addCamion = jest.fn().mockResolvedValue({ id: 1 });

            // Llamar al controlador
            await adminController.postAddTruck(req, res);

            // Verificar que se llamó a addCamion con los parámetros correctos
            expect(camionModel.addCamion).toHaveBeenCalledWith({
                placa: 'ABC123',
                modelo: 'Modelo 2023',
                capacidad: '10',
                estado: 'disponible',
                activo: true,
                conductor_id: null
            });

            // Verificar la respuesta exitosa
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                redirect: '/admin/camiones'
            });
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Camión añadido correctamente');
        });

        it('debe manejar el caso cuando la placa ya existe', async () => {
            // Configurar la solicitud
            req.body = {
                placa: 'ABC123',
                modelo: 'Modelo 2023',
                capacidad: '10',
                estado: 'disponible',
                activo: true
            };

            // Configurar el mock para simular que la placa ya existe
            camionModel.getCamionByPlaca = jest.fn().mockResolvedValue({ id: 1 });

            // Llamar al controlador
            await adminController.postAddTruck(req, res);

            // Verificar la respuesta de error
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ya existe un camión activo con esta placa',
                field: 'placa'
            });
        });
    });

    describe('getCalendarData', () => {
        it('debe devolver los datos del calendario correctamente', async () => {
            const mockCargues = [
                { id: 1, title: 'Cargue 1', start: '2023-01-01', end: '2023-01-02' }
            ];
            cargueModel.getCarguesDesdeEsteMes.mockResolvedValue(mockCargues);

            await adminController.getCalendarData(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/calendarioAdmin',
                expect.objectContaining({
                    title: 'Calendario',
                    carguesCalendario: expect.any(String)
                })
            );
        });

        it('debe manejar errores correctamente', async () => {
            // Configurar el mock para que falle usando un objeto de error simple
            const mockError = { message: 'Error de base de datos' };

            // Mockear la función específica
            const originalFn = cargueModel.getCarguesDesdeEsteMes;
            cargueModel.getCarguesDesdeEsteMes = jest.fn().mockRejectedValue(mockError);

            // Guardar y mockear console.error
            const originalConsoleError = console.error;
            console.error = jest.fn();

            try {
                // Llamar al controlador
                await adminController.getCalendarData(req, res);

                // Verificar que se llamó a la función
                expect(cargueModel.getCarguesDesdeEsteMes).toHaveBeenCalled();

                // Verificar que se registró el error
                expect(console.error).toHaveBeenCalledWith('Error al cargar los datos del calendario:', expect.any(Object));

                // Verificar que se redirige correctamente
                expect(res.redirect).toHaveBeenCalledWith('/admin/calendario-admin');
            } finally {
                // Restaurar la implementación original
                cargueModel.getCarguesDesdeEsteMes = originalFn;
                console.error = originalConsoleError;
            }
        });
    });

    describe('getCargueData', () => {
        it('debe devolver los datos de un cargue específico', async () => {
            const mockCargue = { id: 1, conductor_id: 1, descripcion: 'Cargue de prueba' };
            req.params.id = '1';
            cargueModel.getCargueDetails.mockResolvedValue(mockCargue);
            usersModel.findById.mockResolvedValue({ cedula: '12345678' });

            await adminController.getCargueData(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/cargueDetails',
                expect.objectContaining({
                    title: 'Detalles del Cargue',
                    cargue: expect.any(Object)
                })
            );
        });

        it('debe manejar el caso cuando el cargue no existe', async () => {
            req.params.id = '999';
            cargueModel.getCargueDetails.mockResolvedValue(null);

            await adminController.getCargueData(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/admin/calendario-admin');
        });
    });

    describe('postCargueUpdate', () => {
        it('debe actualizar un cargue exitosamente', async () => {
            // Configurar la solicitud
            req.params = { id: '1' };
            req.body = {
                fecha_inicio_programada: '2023-01-01 08:00:00',
                fecha_fin_programada: '2023-01-01 10:00:00',
                material_nombre: 'Material 1',
                cantidad: '100',
                estado: 'pendiente',
                observaciones: 'Prueba',
                documento: '12345678',
                placa: 'ABC123'
            };
            req.user = { id: 1 };

            // Configurar los mocks
            const mockCargue = {
                id: 1,
                estado: 'pendiente',
                codigo_material: 'MAT001',
                // Asegurarse de que todos los campos requeridos estén presentes
                fecha_inicio_programada: '2023-01-01 08:00:00',
                fecha_fin_programada: '2023-01-01 10:00:00',
                material_nombre: 'Material 1',
                cantidad: '100',
                observaciones: 'Prueba',
                documento: '12345678',
                placa: 'ABC123',
                conductor_id: 1,
                user_id: 1
            };

            // Configurar los mocks
            cargueModel.getCargueDetails = jest.fn().mockResolvedValue(mockCargue);
            camionModel.getConductorByPlaca = jest.fn().mockResolvedValue(1);
            materialModel.getMaterialCodeByName = jest.fn().mockResolvedValue('MAT001');
            cargueModel.updateCargue = jest.fn().mockResolvedValue([1]);

            // Llamar al controlador
            await adminController.postCargueUpdate(req, res);

            // Verificar que se llamó a getMaterialCodeByName
            expect(materialModel.getMaterialCodeByName).toHaveBeenCalledWith('material 1');

            // Verificar que se llamó a updateCargue con los parámetros correctos
            expect(cargueModel.updateCargue).toHaveBeenCalledWith(
                '1', // El ID viene como string
                expect.objectContaining({
                    fecha_inicio_programada: '2023-01-01 08:00:00',
                    fecha_fin_programada: '2023-01-01 10:00:00',
                    material_nombre: 'Material 1',
                    cantidad: '100',
                    estado: 'pendiente',
                    observaciones: 'Prueba',
                    documento: '12345678',
                    placa: 'ABC123',
                    conductor_id: 1,
                    user_id: 1,
                    codigo_material: 'MAT001'
                })
            );

            // Verificar la respuesta
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe('deleteCargue', () => {
        it('debe eliminar un cargue exitosamente', async () => {
            req.params.id = '1';
            cargueModel.deleteCargue.mockResolvedValue(true);

            await adminController.deleteCargue(req, res);

            expect(cargueModel.deleteCargue).toHaveBeenCalledWith('1');
            expect(req.flash).toHaveBeenCalledWith('success_msg', 'Cargue eliminado exitosamente');
            expect(res.redirect).toHaveBeenCalledWith('/admin/calendario-admin');
        });
    });

    describe('getUsersData', () => {
        it('debe devolver la lista de usuarios', async () => {
            const mockUsers = [
                { id: 1, nombre: 'Usuario 1' },
                { id: 2, nombre: 'Usuario 2' }
            ];
            usersModel.getUsers.mockResolvedValue(mockUsers);

            await adminController.getUsersData(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/usuarios',
                expect.objectContaining({
                    title: 'Usuarios',
                    usersData: expect.any(String)
                })
            );
        });
    });

    describe('getClientsData', () => {
        it('debe devolver la lista de clientes', async () => {
            const mockClientes = [
                { id: 1, nombre: 'Cliente 1' },
                { id: 2, nombre: 'Cliente 2' }
            ];
            clienteModel.getClientes.mockResolvedValue(mockClientes);

            await adminController.getClientsData(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/clientes',
                expect.objectContaining({
                    title: 'Clientes',
                    clientsData: expect.any(String)
                })
            );
        });
    });

    describe('getMaterialsData', () => {
        it('debe devolver la lista de materiales', async () => {
            const mockMateriales = [
                { id: 1, nombre: 'Material 1' },
                { id: 2, nombre: 'Material 2' }
            ];
            materialModel.getAllMaterials.mockResolvedValue(mockMateriales);

            await adminController.getMaterialsData(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/materiales',
                expect.objectContaining({
                    title: 'Materiales',
                    materialsData: expect.any(String)
                })
            );
        });
    });
});