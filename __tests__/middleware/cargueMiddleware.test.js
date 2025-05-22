const cargueMiddleware = require('../../src/middlewares/cargueMiddleware');
const cargueModel = require('../../src/models/cargueModel');
const camionModel = require('../../src/models/camionModel');
const materialModel = require('../../src/models/materialModel');
const clienteModel = require('../../src/models/clienteModel');

// Mock the models
jest.mock('../../src/models/cargueModel');
jest.mock('../../src/models/camionModel');
jest.mock('../../src/models/materialModel');
jest.mock('../../src/models/clienteModel');

describe('Cargue Middleware', () => {
    let req, res, next;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const formatDate = (date) => date.toISOString().replace('T', ' ').substring(0, 19);

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Setup fresh request, response and next for each test
        req = {
            body: {},
            params: {},
            user: { id: 1 }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        // Default mock implementations
        camionModel.getCamionByPlaca.mockResolvedValue({
            id: 1,
            placa: 'ABC123',
            capacidad: 200,
            conductor_id: 1
        });
        
        materialModel.getMaterialCodeByName.mockResolvedValue('MAT001');
        clienteModel.getClienteByDocumento.mockResolvedValue({ id: 1 });
        cargueModel.getCarguesByConductor.mockResolvedValue([]);
        cargueModel.getCarguesByCamion.mockResolvedValue([]);
    });

    describe('validateCargue', () => {
        const validCargue = {
            cantidad: '100',
            documento: '12345678',
            placa: 'ABC123',
            material_nombre: 'Material 1',
            fecha_inicio_programada: formatDate(tomorrow),
            fecha_fin_programada: formatDate(dayAfterTomorrow)
        };

        it('debe llamar a next cuando los datos del cargue son válidos', async () => {
            // Arrange
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('debe retornar error cuando falta el campo cantidad', async () => {
            // Arrange
            const invalidCargue = { ...validCargue, cantidad: undefined };
            req.body = invalidCargue;
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                errors: expect.objectContaining({
                    messageNoCantidad: "El campo 'Cantidad' no puede estar vacío"
                })
            });
        });

        it('debe retornar error cuando no se encuentra la placa del camión', async () => {
            // Arrange
            camionModel.getCamionByPlaca.mockResolvedValueOnce(null);
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                errors: expect.objectContaining({
                    messageNoCamion: 'Camión no encontrado'
                })
            });
        });

        it('debe retornar error cuando no se encuentra el material', async () => {
            // Arrange
            materialModel.getMaterialCodeByName.mockResolvedValueOnce(null);
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                errors: expect.objectContaining({
                    messageNoMaterial: 'Material no encontrado'
                })
            });
        });

        it('debe retornar error cuando no se encuentra el cliente por documento', async () => {
            // Arrange
            clienteModel.getClienteByDocumento.mockResolvedValueOnce(null);
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                errors: expect.objectContaining({
                    messageNoCliente: 'Cliente no encontrado'
                })
            });
        });

        it('debe retornar error cuando el conductor no está disponible', async () => {
            // Arrange
            cargueModel.getCarguesByConductor.mockResolvedValueOnce([{ id: 2 }]);
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                errors: expect.objectContaining({
                    messageConductorNoDisponible: expect.stringContaining('El conductor ya tiene un cargue programado')
                })
            });
        });

        it('debe retornar error cuando el camión no está disponible', async () => {
            // Arrange
            cargueModel.getCarguesByCamion.mockResolvedValueOnce([{ id: 2 }]);
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                errors: expect.objectContaining({
                    messageCamionNoDisponible: expect.stringContaining('El camión ya está asignado a otro cargue')
                })
            });
        });

        it('debe manejar errores inesperados y retornar 500', async () => {
            // Arrange
            const error = new Error('Error de base de datos');
            jest.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error
            camionModel.getCamionByPlaca.mockRejectedValueOnce(error);
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(console.error).toHaveBeenCalledWith('Error en validación de cargue:', error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error inesperado al validar el cargue',
                errorDetails: expect.any(String)
            });
            
            // Cleanup
            console.error.mockRestore();        });
    });
});
