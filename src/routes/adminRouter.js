const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const { getDashboardData, getCalendarData, getCargueData, deleteCargue, postCargueUpdate} = require('../controllers/adminController');
const { validateCargue } = require('../middlewares/cargueMiddleware');

adminRouter.get('/inicio', isAdmin, getDashboardData);
adminRouter.get('/calendario-admin', isAdmin, getCalendarData);
adminRouter.get('/cargue/:id', isAdmin, getCargueData);
adminRouter.post('/cargue/:id/update', isAdmin, validateCargue, postCargueUpdate);
adminRouter.get('/cargue/:id/delete', isAdmin, deleteCargue);

adminRouter.get('/usuarios', isAdmin, (req, res) => {
    res.render('pages/admin/usuarios', {
        layout: 'main',
        user: req.user,
    })
});

module.exports = adminRouter;