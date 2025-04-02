const { Router } = require('express');

const loginRouter = Router();

loginRouter.get("/", (req, res) => {
    res.render('pages/login', {
        layout: 'main',
        message: 'Esto es un login'
    });
});

module.exports = loginRouter;