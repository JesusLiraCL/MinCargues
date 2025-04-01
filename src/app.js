//require('dotenv').config();
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");

const app = express();

// Routes
const loginRouter = require("./routes/loginRouter");


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

// Configuración Routes

app.use("/", loginRouter);

//rutas de prueba

module.exports = app;