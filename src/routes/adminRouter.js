const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const { getDashboardData } = require('../controllers/adminController');

adminRouter.get('/inicio', isAdmin, getDashboardData);

adminRouter.get("/calendario-admin", isAdmin, (req, res) => {
    res.render("pages/admin/calendarioAdmin", {
        layout: "main",
        user: req.user,
        tittle: 'Calendario',
    });
});

adminRouter.get("/usuarios", isAdmin, (req, res) => {
    res.render("pages/admin/usuarios", {
        layout: "main",
        user: req.user,
    })
});

module.exports = adminRouter;