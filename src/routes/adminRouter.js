const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const { validateCargue } = require('../middlewares/cargueMiddleware');

// Views Routes
adminRouter.get('/inicio', isAdmin, adminController.getDashboardData);
adminRouter.get('/calendario-admin', isAdmin, adminController.getCalendarData);
adminRouter.get('/cargue/:id', isAdmin, adminController.getCargueData);
adminRouter.get('/agregar-cargue', isAdmin, adminController.getAddCargue);
adminRouter.get('/usuarios', isAdmin, adminController.getUsersData);
adminRouter.get('/camiones', isAdmin, adminController.getTrucksData);
adminRouter.get('/clientes', isAdmin, adminController.getClientsData);
adminRouter.get('/materiales', isAdmin, adminController.getMaterialsData);

// Api Routes

// Cargues
adminRouter.post('/agregar-cargue', isAdmin, validateCargue, adminController.postAddCargue);
adminRouter.post('/cargue/:id/update', isAdmin, validateCargue, adminController.postCargueUpdate);
adminRouter.get('/cargue/:id/delete', isAdmin, adminController.deleteCargue);

// Clientes
adminRouter.get('/api/clientes/buscar', isAdmin, adminController.fetchCliente);
adminRouter.post('/api/clientes/agregar-cliente', isAdmin, adminController.postAddclient);
adminRouter.post('/api/clientes/:documento/update', isAdmin, adminController.postUpdateClient);
adminRouter.get('/api/clientes/:documento/delete', isAdmin, adminController.deleteCliente);

// Usuarios
adminRouter.post('/api/usuarios/agregar-usuario', isAdmin, adminController.postAddUser);
adminRouter.post('/api/usuarios/:nombre_usuario/update', isAdmin, adminController.postUpdateUser);
adminRouter.get('/api/usuarios/:nombre_usuario/delete', isAdmin, adminController.deleteUser);

// Camiones
adminRouter.get('/api/camiones/buscar', isAdmin, adminController.fetchCamion);
adminRouter.post('/api/camiones/agregar-camion', isAdmin, adminController.postAddUser);
adminRouter.post('/api/camiones/:placa/update', isAdmin, adminController.postUpdateUser);
adminRouter.get('/api/camiones/:placa/delete', isAdmin, adminController.deleteUser);

// Materiales
adminRouter.post('/api/materiales/agregar-material', isAdmin, adminController.postAddUser);
adminRouter.post('/api/materiales/:placa/update', isAdmin, adminController.postUpdateUser);
adminRouter.get('/api/materiales/:placa/delete', isAdmin, adminController.deleteUser);

module.exports = adminRouter;