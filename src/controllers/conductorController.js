const cargueModel = require('../models/cargueModel');

const conductorController = {
    getConductorData: async (req, res) => {
        try {
            const [carguesHoy, carguesProximos, carguesEnCurso] = await Promise.all([
                cargueModel.getCarguesConductorHoy(req.user.id),
                cargueModel.getCarguesPendientesConductorHoy(req.user.id),
                cargueModel.getCarguesEnCursoConductor(req.user.id)
            ]);

            const porcentajeCompletados = carguesHoy.asignados > 0
                ? Math.round((carguesHoy.completados / carguesHoy.asignados) * 100)
                : 100;

            res.render('pages/conductor/inicioConductor', {
                layout: 'main',
                title: 'Inicio',
                user: req.user,
                progress: porcentajeCompletados,
                carguesProximos: carguesProximos,
                carguesEnCurso: carguesEnCurso
            });
        } catch (error) {
            console.error('Error al obtener datos del conductor:', error);
            res.status(500).render('error', {
                message: 'Error al cargar los datos del conductor'
            });
        }
    },

    iniciarCargue: async (req, res) => {
        try {
            const cargueId = req.params.id;
            const conductorId = req.user.id;

            const result = await cargueModel.iniciarCargue(cargueId, conductorId);
            
            if (result) {
                res.json({
                    success: true,
                    message: 'Cargue iniciado exitosamente',
                    data: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo iniciar el cargue. Verifica que esté pendiente y te pertenezca.'
                });
            }
        } catch (error) {
            console.error('Error al iniciar cargue:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar el cargue'
            });
        }
    },

    completarCargue: async (req, res) => {
        try {
            const cargueId = req.params.id;
            const conductorId = req.user.id;

            const result = await cargueModel.completarCargue(cargueId, conductorId);
            
            if (result) {
                res.json({
                    success: true,
                    message: 'Cargue completado exitosamente',
                    data: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo completar el cargue. Verifica que esté en progreso y te pertenezca.'
                });
            }
        } catch (error) {
            console.error('Error al completar cargue:', error);
            res.status(500).json({
                success: false,
                message: 'Error al completar el cargue'
            });
        }
    }
};

module.exports = conductorController;