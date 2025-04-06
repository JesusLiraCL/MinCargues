const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');

adminRouter.get('/inicio', isAdmin, (req, res) => {
    res.render('pages/inicio', {
        progress: 65,
        titleBar: "Cargues del día",
        layout: 'main',
        tittle: 'Inicio',
        user: req.user
    });
});

module.exports = adminRouter;