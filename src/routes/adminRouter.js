const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');
const { getDashboardData, getCalendarData } = require('../controllers/adminController');

adminRouter.get('/inicio', isAdmin, getDashboardData);
adminRouter.get("/calendario-admin", isAdmin, getCalendarData);

adminRouter.get("/usuarios", isAdmin, (req, res) => {
    res.render("pages/admin/usuarios", {
        layout: "main",
        user: req.user,
    })
});

module.exports = adminRouter;