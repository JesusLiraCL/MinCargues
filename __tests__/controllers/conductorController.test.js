const conductorController = require('../../src/controllers/conductorController');
const cargueModel = require('../../src/models/cargueModel');

// Mock del modelo
jest.mock('../../src/models/cargueModel');

describe('Conductor Controller', () => {
    let req, res, next;
    let originalConsoleError;

    beforeAll(() => {
        // Guardar la implementación original de console.error
        originalConsoleError = console.error;
        // Mock de console.error para evitar ruido en las pruebas
        console.error = jest.fn();
    });

    afterAll(() => {
        // Restaurar console.error
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        // Configuración inicial para cada prueba
        req = {
            user: { id: 1 },
            params: {}
        };
        
        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        next = jest.fn();
        
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    describe('getConductorData', () => {
        it('debe renderizar la vista con los datos del conductor', async () => {
            // Configurar los mocks
            cargueModel.getCarguesConductorHoy.mockResolvedValue({
                asignados: 5,
                completados: 3
            });
            cargueModel.getCarguesPendientesConductorHoy.mockResolvedValue([
                { id: 1, descripcion: 'Cargue pendiente 1' },
                { id: 2, descripcion: 'Cargue pendiente 2' }
            ]);
            cargueModel.getCarguesEnCursoConductor.mockResolvedValue([
                { id: 3, descripcion: 'Cargue en curso' }
            ]);

            // Llamar al controlador
            await conductorController.getConductorData(req, res);

            // Verificar que se llamó a render con los parámetros correctos
            expect(res.render).toHaveBeenCalledWith(
                'pages/conductor/inicioConductor',
                expect.objectContaining({
                    layout: 'main',
                    title: 'Inicio',
                    progress: 60, // (3/5)*100 redondeado
                    carguesProximos: expect.any(Array),
                    carguesEnCurso: expect.any(Array)
                })
            );
        });

        it('debe manejar errores correctamente', async () => {
            // Configurar el mock para que falle
            const error = new Error('Error de base de datos');
            cargueModel.getCarguesConductorHoy.mockRejectedValue(error);

            // Llamar al controlador
            await conductorController.getConductorData(req, res);

            // Verificar que se llamó a console.error
            expect(console.error).toHaveBeenCalledWith('Error al obtener datos del conductor:', error);
            
            // Verificar que se llamó a status con 500
            expect(res.status).toHaveBeenCalledWith(500);
            
            // Verificar que se llamó a render con el mensaje de error
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Error al cargar los datos del conductor'
            });
        });
    });

    describe('iniciarCargue', () => {
        it('debe iniciar un cargue exitosamente', async () => {
            // Configurar la solicitud
            req.params.id = '123';
            
            // Configurar el mock para simular éxito
            cargueModel.iniciarCargue.mockResolvedValue({
                id: 123,
                estado: 'en_curso'
            });

            // Llamar al controlador
            await conductorController.iniciarCargue(req, res);

            // Verificar la respuesta
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Cargue iniciado exitosamente',
                data: { id: 123, estado: 'en_curso' }
            });
        });

        it('debe manejar el caso cuando no se puede iniciar el cargue', async () => {
            // Configurar la solicitud
            req.params.id = '456';
            
            // Configurar el mock para simular fallo
            cargueModel.iniciarCargue.mockResolvedValue(null);

            // Llamar al controlador
            await conductorController.iniciarCargue(req, res);

            // Verificar la respuesta de error
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No se pudo iniciar el cargue. Verifica que esté pendiente y te pertenezca.'
            });
        });
    });
});
