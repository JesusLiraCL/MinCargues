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

adminRouter.get('/usuarios', isAdmin, (req, res) => {
    res.render('pages/admin/usuarios', {
        layout: 'main',
        user: req.user,
    })
});

// apis
adminRouter.get('/api/clientes/buscar', isAdmin, adminController.fetchCliente);
adminRouter.get('/api/conductores/buscar', isAdmin, adminController.fetchConductor);
adminRouter.get('/api/camiones/buscar', isAdmin, adminController.fetchCamion);


module.exports = adminRouter;