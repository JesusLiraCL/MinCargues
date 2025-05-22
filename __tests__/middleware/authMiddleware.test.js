const authMiddleware = require('../../src/middlewares/authMiddleware');

// Mock response object
const mockResponse = () => {
    const res = {};
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
};

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Setup fresh request, response and next for each test
        req = {
            isAuthenticated: jest.fn(),
            user: null
        };
        res = mockResponse();
        next = jest.fn();
    });

    describe('isAuthenticated', () => {
        it('debe llamar a next cuando el usuario está autenticado', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            
            // Act
            authMiddleware.isAuthenticated(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        it('debe redirigir a / cuando el usuario no está autenticado', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(false);
            
            // Act
            authMiddleware.isAuthenticated(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isAdmin', () => {
        it('debe llamar a next cuando el usuario es administrador', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL001' };
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        it('debe redirigir a / cuando el usuario no está autenticado', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(false);
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        it('debe redirigir a / cuando el usuario no tiene rol', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = {};
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        it('debe redirigir a / cuando el usuario no es administrador', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL002' }; // No es administrador
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isConductor', () => {
        it('debe llamar a next cuando el usuario es conductor', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL002' };
            
            // Act
            authMiddleware.isConductor(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        it('debe redirigir a / cuando el usuario no está autenticado', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(false);
            
            // Act
            authMiddleware.isConductor(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        it('debe redirigir a / cuando el usuario no es conductor', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL001' }; // No es conductor
            
            // Act
            authMiddleware.isConductor(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });
    });
});
