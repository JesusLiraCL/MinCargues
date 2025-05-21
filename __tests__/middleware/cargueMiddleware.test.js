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

        it('should call next for valid cargue data', async () => {
            // Arrange
            req.body = { ...validCargue };
            
            // Act
            await cargueMiddleware.validateCargue(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return error if cantidad is missing', async () => {
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

        it('should return error if placa is not found', async () => {
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

        it('should return error if material is not found', async () => {
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

        it('should return error if cliente is not found by documento', async () => {
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

        it('should return error if conductor is not available', async () => {
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

        it('should return error if camion is not available', async () => {
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

        it('should handle errors and return 500', async () => {
            // Arrange
            const error = new Error('Database error');
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
            console.error.mockRestore();
        });
    });
});
