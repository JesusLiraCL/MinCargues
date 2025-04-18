const CargueModel = require('../models/carguesModel');
const CamionModel = require('../models/camionesModel');

const adminController = {
    getDashboardData: async (req, res) => {

        // 1. Obtener todos los datos en paralelo
        const [
            totalCamiones,
            carguesCompletados,
            carguesAsignados,
            carguesEnCurso,
            carguesPendientes
        ] = await Promise.all([
            CamionModel.getTotalCamionesHabilitados(),
            CargueModel.getCarguesCompletadosHoy(),
            CargueModel.getCarguesAsignadosHoy(),
            CargueModel.getCarguesEnCurso(),
            CargueModel.getCarguesPendientesHoy()
        ]);

        // 2. Calcular métricas
        const porcentajeCompletados = carguesAsignados > 0
            ? Math.round((carguesCompletados / carguesAsignados) * 100)
            : 0;

        const camionesEnUso = new Set(carguesEnCurso.map(c => c.placa)).size;
        const porcentajeCamionesEnUso = totalCamiones > 0
            ? Math.round((camionesEnUso / totalCamiones) * 100)
            : 0;

        // 3. Formatear datos para la vista
        res.render('pages/admin/inicioAdmin', {
            layout: 'main',
            title: 'Inicio',
            user: req.user,

            // Métricas principales
            progress: porcentajeCompletados,
            truckUsage: porcentajeCamionesEnUso,

            // Tabla de cargues en curso
            currentData: {
                headers: ["Placa", "Tipo de camión", "Material", "Conductor", "Cliente", "Inicio real", "Inicio prog.", "Fin prog."],
                rows: carguesEnCurso.map(c => ([
                    c.placa,
                    c.tipo_camion,
                    c.material,
                    c.conductor,
                    c.cliente,
                    c.fecha_inicio_real,
                    c.fecha_inicio_programada,
                    c.fecha_fin_programada
                ]))
            },

            // Tabla de cargues pendientes
            nextData: {
                headers: ["Placa", "Tipo de camión", "Material", "Conductor", "Cliente", "Inicio real", "Inicio prog.", "Fin prog."],
                rows: carguesPendientes.map(c => ([
                    c.placa,
                    c.tipo_camion,
                    c.material,
                    c.conductor,
                    c.cliente,
                    c.fecha_inicio_real,
                    c.fecha_inicio_programada,
                    c.fecha_fin_programada
                ]))
            },

            // Metadata adicional
            stats: {
                totalCamiones,
                camionesEnUso,
                carguesCompletados,
                carguesAsignados
            }
        });

    }
};

module.exports = adminController;