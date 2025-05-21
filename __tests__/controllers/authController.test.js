const authController = require('../../src/controllers/authController');
const passport = require('passport');

// Mock de los objetos y funciones necesarias
jest.mock('passport');

describe('Auth Controller', () => {
  describe('showLogin', () => {
    it('debe renderizar la vista de login con mensaje de error si existe', () => {
      const req = {
        flash: jest.fn().mockReturnValue(['Error de autenticación']),
        user: null
      };
      const res = {
        render: jest.fn()
      };

      authController.showLogin(req, res);

      expect(res.render).toHaveBeenCalledWith('pages/login', {
        message: 'Error de autenticación',
        user: null
      });
    });
  });

  describe('login', () => {
    it('debe redirigir a /admin/inicio para usuarios con rol de administrador', () => {
      const req = {
        body: { username: 'admin', password: 'password' },
        login: jest.fn((user, callback) => callback(null)),
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      // Configurar el mock de passport.authenticate
      passport.authenticate.mockImplementation((strategy, callback) => {
        return (req, res, next) => {
          callback(null, { codigo_rol: 'ROL001' }, null);
        };
      });

      authController.login(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/inicio');
    });
  });

  describe('logout', () => {
    it('debe cerrar la sesión y redirigir a /', () => {
      const req = {
        logout: jest.fn((callback) => callback(null))
      };
      const res = {
        redirect: jest.fn()
      };
      const next = jest.fn();

      authController.logout(req, res, next);

      expect(req.logout).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });
});
