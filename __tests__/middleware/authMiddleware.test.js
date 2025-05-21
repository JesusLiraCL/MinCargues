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
        it('should call next if user is authenticated', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            
            // Act
            authMiddleware.isAuthenticated(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        it('should redirect to / if user is not authenticated', () => {
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
        it('should call next if user is authenticated and has admin role', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL001' };
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        it('should redirect to / if user is not authenticated', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(false);
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        it('should redirect to / if user has no role', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = {};
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        it('should redirect to / if user is not an admin', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL002' }; // Non-admin role
            
            // Act
            authMiddleware.isAdmin(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isConductor', () => {
        it('should call next if user is authenticated and has conductor role', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL002' };
            
            // Act
            authMiddleware.isConductor(req, res, next);
            
            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        it('should redirect to / if user is not authenticated', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(false);
            
            // Act
            authMiddleware.isConductor(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        it('should redirect to / if user is not a conductor', () => {
            // Arrange
            req.isAuthenticated.mockReturnValue(true);
            req.user = { codigo_rol: 'ROL001' }; // Admin role, not conductor
            
            // Act
            authMiddleware.isConductor(req, res, next);
            
            // Assert
            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });
    });
});
