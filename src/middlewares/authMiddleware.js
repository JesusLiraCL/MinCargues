module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/');
    },
    isAdmin: (req, res, next) => {
        if (!req.isAuthenticated()) {
            console.log('Usuario no autenticado');
            return res.redirect('/');
        }

        if (!req.user || !req.user.codigo_rol) {
            console.log('Rol de usuario no encontrado');
            return res.redirect('/');
        }

        if (req.user.codigo_rol === 'ROL001') {
            return next();
        }

        res.redirect('/');
    },
    isConductor: (req, res, next) => {
        if (req.isAuthenticated() && req.user.codigo_rol === 'ROL002') return next();
        res.redirect('/');
    }
};