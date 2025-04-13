const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');

adminRouter.get('/inicio', isAdmin, (req, res) => {
    res.render('pages/admin/inicioAdmin', {
        progress: 65,
        titleBar: "Cargues del día",
        layout: 'main',
        tittle: 'Inicio',
        user: req.user,
        currentData: {
            headers: ["Nombre", "Edad", "Email", "Ciudad"],
            rows: [
                ["Juan Pérez", 28, "juan@example.com", "Madrid"],
                ["María García", 34, "maria@example.com", "Barcelona"],
                ["Carlos López", 22, "carlos@example.com", "Valencia"],
                ["Ana Martínez", 45, "ana@example.com", "Sevilla"],
                ["Carlos López", 22, "carlos@example.com", "Valencia"],
            ]
        },
        nextData: {
            headers: ["Nombre", "Edad", "Email", "Ciudad"],
            rows: [
                ["Juan Pérez", 28, "juan@example.com", "Madrid"],
                ["María García", 34, "maria@example.com", "Barcelona"],
                ["Carlos López", 22, "carlos@example.com", "Valencia"],
                ["Ana Martínez", 45, "ana@example.com", "Sevilla"],
                ["Carlos López", 22, "carlos@example.com", "Valencia"],
            ]
        },

    });
});

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