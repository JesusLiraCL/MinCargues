const passport = require('passport');

module.exports = {
    showLogin: (req, res) => {
        res.render('pages/login', {
            message: req.flash('error')
        });
    },

    login: (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                console.log("hubo un error");
                req.flash('error', info.message);
                return res.redirect('/');
            }
            req.login(user, (err) => {
                if (err) return next(err);

                if (user.codigo_rol === 'ROL001') {
                    console.log("entro al if");
                    return res.redirect('/admin/inicio');
                }
                if (user.codigo_rol === 'ROL002') return res.redirect('/conductor/inicio');
                return res.redirect('/test');
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