const { Router } = require('express');

const authorRouter = Router();

authorRouter.get("/", (req, res) => {
    res.render('pages/login', {
        layout: 'auth',
        message: 'Esto es un login'
    });
});

module.exports = authorRouter;