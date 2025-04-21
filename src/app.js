require('dotenv').config();
const express = require("express");
const path = require("path");
const { create } = require('express-handlebars');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const flash = require('express-flash');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Config Handlebars
const hbs = create({
    extname: '.hbs',
    defaultLayout: 'login',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        eq: function (a, b) {
            return a === b;
        }, 
    }
});

app.engine('.hbs', hbs.engine);
app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));

// Session Set up
app.use(session({
    store: new pgSession({
        conString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 1 día de duración
    }
}));

app.use(flash());
require("./config/passport.js");
const passport = require('passport');

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes required
const authRouter = require("./routes/authRouter");
const usersRouter = require("./routes/usersRouter");
const adminRouter = require('./routes/adminRouter');
const conductorRouter = require('./routes/conductorRouter');

const saltRounds = 10;

const { Pool } = require('pg'); // Añade esto al inicio con los demás requires

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Verifica la conexión al iniciar
pool.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Error conectando a PostgreSQL:', err);
    else console.log('✅ Conectado a PostgreSQL');
});

app.get('/quick-create-user', (req, res) => {
    res.send(`
        <h1>Crear Usuario de Prueba</h1>
        <form action="/quick-create-user" method="POST">
            <input type="text" name="nombre" placeholder="Nombre" required><br>
            <input type="password" name="contrasena" placeholder="Contraseña" required><br>
            <select name="codigo_rol">
                <option value="ROL001">Admin</option>
                <option value="ROL002">Conductor</option>
            </select><br>
            <button type="submit">Crear</button>
        </form>
        <style>input,select{margin:5px;}</style>
    `);
});

// Ruta POST para procesar el formulario
app.post('/quick-create-user', async (req, res) => {
    try {
        const { nombre, contrasena, codigo_rol } = req.body;

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

        // Insertar en PostgreSQL
        const query = `
            INSERT INTO usuarios (nombre, contrasena, codigo_rol) 
            VALUES ($1, $2, $3) 
            RETURNING id, nombre, codigo_rol
        `;
        const { rows } = await pool.query(query, [nombre, hashedPassword, codigo_rol]);

        res.send(`
            <h2>¡Usuario creado!</h2>
            <p><strong>Nombre:</strong> ${rows[0].nombre}</p>
            <p><strong>codigo_rol:</strong> ${rows[0].codigo_rol}</p>
            <p><strong>Contraseña hasheada:</strong> ${hashedPassword}</p>
            <a href="/">Volver al login</a>
        `);
    } catch (error) {
        console.error('Error:', error);
        res.send(`
            <h2>Error al crear usuario</h2>
            <p>${error.message.includes('unique') ? 'El usuario ya existe' : error.message}</p>
            <a href="/quick-create-user">Intentar de nuevo</a>
        `);
    }
});

// Call Routes
app.use("/", authRouter);
app.use('/admin', adminRouter);
app.use('/conductor', conductorRouter);

const bcrypt = require('bcryptjs');

// Test BD connection with users
app.use("/testbd", usersRouter);

module.exports = app;