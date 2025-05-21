const adminController = require('../../src/controllers/adminController');
const cargueModel = require('../../src/models/cargueModel');
const camionModel = require('../../src/models/camionModel');
const usersModel = require('../../src/models/usersModel');
const bcrypt = require('bcryptjs');

// Mock de los módulos
jest.mock('../../src/models/cargueModel');
jest.mock('../../src/models/camionModel');
jest.mock('../../src/models/usersModel');
jest.mock('bcryptjs');

describe('Admin Controller', () => {
    let req, res, next;

    beforeEach(() => {
        // Configuración inicial para cada prueba
        req = {
            body: {},
            params: {},
            user: { id: 1 },
            flash: jest.fn()
        };
        
        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        next = jest.fn();
        
        // Configuración común de mocks
        res.redirect.mockImplementation(() => res);
        
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getDashboardData', () => {
        it('debe renderizar el dashboard con los datos correctos', async () => {
            // Configurar los mocks
            camionModel.getTotalCamionesHabilitados.mockResolvedValue(10);
            cargueModel.getCarguesCompletadosHoy.mockResolvedValue(5);
            cargueModel.getCarguesAsignadosHoy.mockResolvedValue(8);
            cargueModel.getCarguesEnCurso.mockResolvedValue([
                { 
                    id: 1, 
                    placa: 'ABC123', 
                    conductor: 'Conductor 1', 
                    material: 'Material 1', 
                    cantidad: 10,
                    inicio_real: null,
                    fin_real: null
                },
                { 
                    id: 2, 
                    placa: 'DEF456', 
                    conductor: 'Conductor 2', 
                    material: 'Material 2', 
                    cantidad: 15,
                    inicio_real: null,
                    fin_real: null
                }
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
                },
                { 
                    id: 2, 
                    placa: 'DEF456', 
                    conductor: 'Conductor 2', 
                    material: 'Material 2', 
                    cantidad: 15, 
                    inicio_programado: '10:00', 
                    fin_programado: '12:00'
                }
            ]);

            // Llamar al controlador
            await adminController.getDashboardData(req, res);

            // Verificar que se llamó a render con los parámetros correctos
            expect(res.render).toHaveBeenCalledWith(
                'pages/admin/inicioAdmin',
                expect.objectContaining({
                    layout: 'main',
                    title: 'Inicio',
                    user: { id: 1 },
                    stats: {
                        totalCamiones: 10,
                        carguesCompletados: 5,
                        carguesAsignados: 8,
                        camionesEnUso: 2
                    },
                    currentData: expect.objectContaining({
                        headers: expect.any(Array),
                        rows: expect.any(Array)
                    }),
                    nextData: expect.objectContaining({
                        headers: expect.any(Array),
                        rows: expect.any(Array)
                    }),
                    progress: 63,
                    truckUsage: 20
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
});
