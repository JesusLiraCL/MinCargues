const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const { validateCargue } = require('../middlewares/cargueMiddleware');

// Routes
adminRouter.get('/inicio', isAdmin, adminController.getDashboardData);
adminRouter.get('/calendario-admin', isAdmin, adminController.getCalendarData);
adminRouter.get('/cargue/:id', isAdmin, adminController.getCargueData);
adminRouter.post('/cargue/:id/update', isAdmin, validateCargue, adminController.postCargueUpdate);
adminRouter.get('/cargue/:id/delete', isAdmin, adminController.deleteCargue);
adminRouter.get('/agregar-cargue', isAdmin, adminController.getAddCargue);
adminRouter.post('/agregar-cargue', isAdmin, validateCargue, adminController.postAddCargue);
adminRouter.get('/usuarios', isAdmin, adminController.getUsersData);
adminRouter.get('/camiones', isAdmin, adminController.getTrucksData);
adminRouter.get('/clientes', isAdmin, adminController.getClientsData);
adminRouter.get('/materiales', isAdmin, adminController.getMaterialsData);

adminRouter.get('/agregar-usuario', isAdmin, (req, res) =>{
    res.render('pages/admin/addUsuario', {
        layout: "main",
        user: req.user,
        title: 'Agregar Usuario'
    })
})

// apis
adminRouter.get('/api/clientes/buscar', isAdmin, adminController.fetchCliente);
adminRouter.get('/api/camiones/buscar', isAdmin, adminController.fetchCamion);

adminRouter.post('/api/clientes/agregar-cliente', isAdmin, adminController.postAddclient);
adminRouter.post('/api/clientes/:documento/update', isAdmin, adminController.postUpdateClient);
adminRouter.get('/api/clientes/:documento/delete', isAdmin, adminController.deleteCliente)

module.exports = adminRouter;