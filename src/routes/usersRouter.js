const { Router } = require('express');
const usersController = require("../controllers/usersController");

const usersRouter = Router();

usersRouter.get("/", usersController.getUsers);

module.exports = usersRouter;