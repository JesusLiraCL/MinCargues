require('dotenv').config();
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");

const app = express();

// Routes required
const loginRouter = require("./routes/loginRouter");
const usersRouter = require("./routes/usersRouter");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Config Handlebars
app.set("view engine", "hbs");

app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('views', path.join(__dirname, 'views'));

// Call Routes
app.get("/", (req, res) => res.redirect("/login"));
app.use("/login", loginRouter);
// Test BD connection with users
app.use("/testbd", usersRouter);

module.exports = app;