const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/authMiddleware');

adminRouter.get('/inicio', isAdmin, (req, res) => {
    res.render('pages/admin/inicio', { user: req.user });
});

module.exports = adminRouter;