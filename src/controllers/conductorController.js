const cargueModel = require('../models/cargueModel');

const conductorController = {
    getConductorData: async (req, res) => {
        // Obtener los cargues del conductor
        const carguesHoy = await cargueModel.getCarguesConductorHoy(req.user.id);
        
        // Calcular el porcentaje de completados
        const porcentajeCompletados = carguesHoy.asignados > 0
            ? Math.round((carguesHoy.completados / carguesHoy.asignados) * 100)
            : 100;

        res.render('pages/conductor/inicioConductor', {
            layout: 'main',
            title: 'Inicio',
            user: req.user,
            progress: porcentajeCompletados
        });
    }
}

module.exports = conductorController;