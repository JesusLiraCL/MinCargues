const express = require('express');
const conductorRouter = express.Router();
const conductorController = require('../controllers/conductorController');
const { isConductor } = require('../middlewares/authMiddleware');

conductorRouter.get('/inicio', isConductor, conductorController.getConductorData);
conductorRouter.post('/iniciar-cargue/:id', isConductor, conductorController.iniciarCargue);
conductorRouter.post('/completar-cargue/:id', isConductor, conductorController.completarCargue);

module.exports = conductorRouter;