const express = require('express');
const conductorRouter = express.Router();
const { isConductor } = require('../middlewares/authMiddleware');

conductorRouter.get('/inicio', isConductor, (req, res) => {
    res.render('pages/admin/inicio', { user: req.user });
});

module.exports = conductorRouter;