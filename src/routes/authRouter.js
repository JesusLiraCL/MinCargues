const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/authController');

authRouter.get('/', authController.showLogin);
authRouter.post('/', authController.login);
authRouter.get('/logout', authController.logout);

module.exports = authRouter;