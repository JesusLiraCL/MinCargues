const reportesController = require('../../src/controllers/reportesController');
const { generarPDF } = require('../../src/middlewares/pdfService');
const db = require('../../src/config/database');

// Mock de los módulos
jest.mock('../../src/middlewares/pdfService');

// Mock de la base de datos
jest.mock('../../src/config/database');

describe('Reportes Controller', () => {
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
            body: {}
        };
        
        res = {
            setHeader: jest.fn(),
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        next = jest.fn();
        
        // Configuración común de mocks
        res.setHeader.mockImplementation(() => res);
        res.send.mockImplementation(() => res);
        
        // Mock de la respuesta de la base de datos
        db.query.mockResolvedValue({ rows: [] });
    });

    afterEach(() => {
        // Limpiar todos los mocks después de cada prueba
        jest.clearAllMocks();
        // Limpiar cualquier temporizador pendiente
        jest.clearAllTimers();
    });

    afterAll(async () => {
        // Asegurarse de que todos los temporizadores estén limpios
        jest.useRealTimers();
        // Cerrar cualquier conexión pendiente
        await new Promise(resolve => setImmediate(resolve));
    });

    describe('generarPDF', () => {
        it('debe generar un PDF con filtros personalizados', async () => {
            // Configurar la solicitud con filtros personalizados
            req.body = {
                desde_opcion: 'custom',
                hasta_opcion: 'custom',
                fecha_inicio: '01-01-2023',
                fecha_fin: '31-01-2023',
                ordenado: 'fecha_asc',
                cliente: '1',
                camion: '2',
                conductor: '3',
                incluir_cargues: 'on'
            };

            // Configurar el mock para simular la generación exitosa del PDF
            const mockPDFBuffer = Buffer.from('PDF generado');
            generarPDF.mockResolvedValue(mockPDFBuffer);

            // Llamar al controlador
            await reportesController.generarPDF(req, res);

            // Verificar que se configuraron los encabezados correctamente
            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/pdf'
            );
            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename=reporte_cargues.pdf'
            );

            // Verificar que se envió el PDF
            expect(res.send).toHaveBeenCalledWith(mockPDFBuffer);
        });

        it('debe generar un PDF con filtros por defecto (hoy)', async () => {
            // Configurar la solicitud con opciones por defecto
            req.body = {
                desde_opcion: 'today',
                hasta_opcion: 'today',
                ordenado: 'fecha_desc'
            };

            // Configurar el mock para simular la generación exitosa del PDF
            const mockPDFBuffer = Buffer.from('PDF generado');
            generarPDF.mockResolvedValue(mockPDFBuffer);

            // Llamar al controlador
            await reportesController.generarPDF(req, res);

            // Verificar que se llamó a generarPDF con los parámetros correctos
            expect(generarPDF).toHaveBeenCalledWith(
                expect.objectContaining({
                    desde_opcion: 'today',
                    hasta_opcion: 'today'
                }),
                'fecha_desc',
                false
            );
        });

        it('debe manejar errores durante la generación del PDF', async () => {
            // Configurar la solicitud
            req.body = {
                desde_opcion: 'today',
                hasta_opcion: 'today'
            };

            // Configurar el mock para simular un error
            const error = new Error('Error al generar PDF');
            generarPDF.mockRejectedValue(error);

            // Llamar al controlador
            await reportesController.generarPDF(req, res);

            // Verificar que se llamó a console.error con el error
            expect(console.error).toHaveBeenCalledWith('Error al generar el reporte:', error);

            // Verificar que se manejó el error correctamente
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error al generar el reporte',
                error: error.message
            });
        });
    });
});
