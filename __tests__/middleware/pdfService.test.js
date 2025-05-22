const fs = require('fs');
const path = require('path');

// Mock fs and nodemailer
jest.mock('fs');
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn((options, callback) => {
            callback(null, { messageId: 'mocked-message-id' });
        })
    })
}));

// Mock fs.existsSync and readFileSync
const mockLogoData = Buffer.from('mock-logo-data');
fs.existsSync.mockReturnValue(true);
fs.readFileSync.mockReturnValue(mockLogoData);
fs.mkdirSync.mockImplementation(() => {});

// Mock jspdf-autotable
const mockAutoTable = jest.fn();

// First define the mock function with chaining support
const mockJsPDF = jest.fn().mockImplementation(() => {
    const mockDoc = {
        addImage: jest.fn().mockReturnThis(),
        setFont: jest.fn().mockReturnThis(),
        setFontSize: jest.fn().mockReturnThis(),
        setTextColor: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        save: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnValue('mocked-pdf-data'),
        // Add getter for internal properties that jspdf-autotable might access
        internal: {
            getFontSize: jest.fn().mockReturnValue(12), // Default font size
            getFont: jest.fn().mockReturnValue('helvetica')
        }
    };
    
    // Add autoTable method that calls our mock
    mockDoc.autoTable = mockAutoTable;
    return mockDoc;
});

// Mock jspdf module with autoTable
jest.doMock('jspdf', () => {
    const actualJsPDF = jest.requireActual('jspdf');
    return {
        __esModule: true,
        default: mockJsPDF,
        jsPDF: mockJsPDF
    };
});

// Mock jspdf-autotable
jest.doMock('jspdf-autotable', () => ({
    __esModule: true,
    default: mockAutoTable,
    autoTable: mockAutoTable
}));

// Now require the module after setting up the mocks
const { generarPDF, enviarReportePorCorreo } = require('../../src/middlewares/pdfService');

describe('PDF Service', () => {
    const mockCargues = [
        {
            id: 1,
            documento: '12345678',
            cliente_nombre: 'Cliente Test',
            material_nombre: 'Material Test',
            cantidad: '100',
            fecha_inicio_programada: '2023-01-01T08:00:00.000Z',
            fecha_fin_programada: '2023-01-01T10:00:00.000Z',
            estado: 'completado',
            placa: 'ABC123',
            // Add missing required fields
            nombre_cliente: 'Cliente Test',
            nombre_conductor: 'Conductor Test',
            cedula_conductor: '87654321',
            nombre_material: 'Material Test',
            codigo_material: 'MT001'
        }
    ];

    const mockFiltros = {
        desdeOpcion: 'custom',
        hastaOpcion: 'custom',
        fechaDesde: '2023-01-01',
        fechaHasta: '2023-01-31'
    };

    let mockTransport;
    let mockPdfInstance;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create a new mock instance for each test
        mockPdfInstance = new mockJsPDF();
        
        // Mock fs methods
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(mockLogoData);
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFile = jest.fn((path, data, callback) => {
            if (typeof callback === 'function') {
                callback(null);
            }
            return true;
        });
        fs.readFile.mockImplementation((path, encoding, callback) => {
            if (typeof encoding === 'function') {
                callback = encoding;
            }
            callback(null, 'mocked-pdf-content');
        });
        fs.writeFileSync = jest.fn();
        
        // Mock Date
        const mockDate = new Date('2023-01-01T12:00:00Z');
        global.Date = jest.fn(() => mockDate);
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        // Mock doc.output
        const mockDoc = mockJsPDF();
        mockDoc.output.mockReturnValue('mocked-pdf-data');
        
        // Reset the mockAutoTable implementation
        mockAutoTable.mockImplementation(() => {});
    });

    describe('generarPDF', () => {
        it('debe generar un archivo PDF en modo vista previa', async () => {
            // Act - Llamar con isPreview = true
            const result = await generarPDF(mockCargues, true, mockFiltros);

            // Assert
            expect(mockJsPDF).toHaveBeenCalled();
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(typeof result).toBe('string');
            expect(result).toContain('/reportes/');
        });

        it('debe retornar un ArrayBuffer en modo no vista previa', async () => {
            // Act - Llamar con isPreview = false (por defecto)
            const result = await generarPDF(mockCargues, false, mockFiltros);

            // Assert
            expect(mockJsPDF).toHaveBeenCalled();
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.writeFileSync).not.toHaveBeenCalled();
            expect(result).toBe('mocked-pdf-data');
        });
    });

    describe('enviarReportePorCorreo', () => {
        let mockTransport;

        beforeEach(() => {
            // Configurar las variables de entorno necesarias para la función
            process.env.SMTP_HOST = 'smtp.test.com';
            process.env.SMTP_PORT = '587';
            process.env.SMTP_USER = 'test@example.com';
            process.env.SMTP_PASS = 'testpass';

            // Limpiar todos los mocks antes de cada prueba
            jest.clearAllMocks();
            
            // Mock del modelo de reporte
            const reporteModel = require('../../src/models/reporteModel');
            reporteModel.obtenerCargues = jest.fn().mockResolvedValue(mockCargues);
            
            // Mock de generarPDF para retornar un objeto similar a un buffer
            const pdfService = require('../../src/middlewares/pdfService');
            jest.spyOn(pdfService, 'generarPDF').mockResolvedValue(Buffer.from('mocked-pdf-buffer'));
            
            // Mock del transporte de nodemailer
            mockTransport = {
                sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
                    // Llamar al callback con éxito
                    callback(null, { messageId: 'test-message-id' });
                    // También retornar una promesa para soporte async/await
                    return Promise.resolve({ messageId: 'test-message-id' });
                })
            };
            
            const nodemailer = require('nodemailer');
            nodemailer.createTransport.mockReturnValue(mockTransport);
        });

        it('debe manejar errores al enviar el correo', async () => {
            // Arrange
            const testEmail = 'test@example.com';
            const error = new Error('Error al enviar el correo');
            
            // Silenciar console.error para esta prueba
            const originalConsoleError = console.error;
            console.error = jest.fn();
            
            try {
                // Override the mock to simulate error
            mockTransport.sendMail.mockImplementationOnce((mailOptions, callback) => {
                    if (typeof callback === 'function') {
                callback(error);
                    }
                return Promise.reject(error);
            });
            
            // Act
                const result = await enviarReportePorCorreo(testEmail);
            
            // Assert
                expect(require('nodemailer').createTransport).toHaveBeenCalled();
                expect(mockTransport.sendMail).toHaveBeenCalled();
                expect(result).toBe(false);
                expect(console.error).toHaveBeenCalledWith('Error al enviar el reporte por correo:', expect.any(Error));
            } finally {
                // Restore console.error
                console.error = originalConsoleError;
            }
        });
    });
});
