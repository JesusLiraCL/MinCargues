const express = require('express');
const conductorRouter = express.Router();
const conductorController = require('../controllers/conductorController');
const { isConductor } = require('../middlewares/authMiddleware');

conductorRouter.get('/inicio', isConductor, conductorController.getConductorData);

module.exports = conductorRouter;