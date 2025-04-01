//require('dotenv').config();
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Configuración Handlebars
app.set("view engine", "hbs");

app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('views', path.join(__dirname, 'views'));


//rutas de prueba
app.get('/', (req, res) => {
    res.render('home', { title: 'Sistema de Información' });
});

app.get('/login', (req, res) => {
    res.render('auth/login', {
        layout: 'auth',
        message: 'Esto es un login'
    });
});

module.exports = app;