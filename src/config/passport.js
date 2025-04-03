const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },
    async (username, password, done) => {
        try {
            // Buscar el usuario en la base de datos
            const user = await User.findByUsername(username);

            if (!user) {
                return done(null, false, { message: 'Usuario no encontrado' });
            }

            // Comparar contraseñas
            const isValidPassword = await bcrypt.compare(password, user.contrasena);

            if (!isValidPassword) {
                console.log("contraseña no valida");
                return done(null, false, { message: 'Contraseña incorrecta' });
            }

            // Si todo es correcto, retornar el usuario
            console.log("se encontro el usuario: mandandolo");
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialización del usuario (guardar en sesión)
passport.serializeUser((user, done) => {
    // Guardamos tanto el ID como el rol en un objeto
    done(null, { id: user.id, codigo_rol: user.codigo_rol });
});

// Deserialización del usuario (recuperar de sesión)
passport.deserializeUser(async (userData, done) => {
    try {
        const user = await User.findById(userData.id);
        if (user) {
            // Asegurarnos de que el rol esté disponible
            user.codigo_rol = userData.codigo_rol;
        }
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
