const passport = require('passport');

module.exports = {
    showLogin: (req, res) => {
        res.render('pages/login', {
            message: req.flash('error')[0],
            user: req.user || null
        });
    },

    login: (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                req.flash('error', info.message || "Credenciales incorrectas");
                return res.redirect('/');
            }
            req.login(user, (err) => {
                if (err) return next(err);

                if (user.codigo_rol === 'ROL001') return res.redirect('/admin/inicio');
                if (user.codigo_rol === 'ROL002') return res.redirect('/conductor/inicio');

                req.flash('error', 'No tienes permisos para acceder');
                return res.redirect('/');

            });
        })(req, res, next);
    },

    logout: (req, res) => {
        req.logout((err) => {
            if (err) return next(err);
            res.redirect('/');
        });
    },
};