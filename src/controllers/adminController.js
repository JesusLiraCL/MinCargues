const cargueModel = require('../models/cargueModel');
const camionModel = require('../models/camionModel');

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
            camionModel.getTotalCamionesHabilitados(),
            cargueModel.getCarguesCompletadosHoy(),
            cargueModel.getCarguesAsignadosHoy(),
            cargueModel.getCarguesEnCurso(),
            cargueModel.getCarguesPendientesHoy()
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
                headers: ["ID", "Placa", "Conductor", "Material", "Cantidad", "Inicio prog.", "Inicio real"],     
                rows: carguesEnCurso.map(c => ([
                    c.id,
                    c.placa,
                    c.conductor,
                    c.material,
                    c.cantidad + (c.unidad ? ` ${c.unidad}` : ''),
                    c.fecha_inicio_programada,
                    c.fecha_inicio_real
                ]))
            },

            // Tabla de cargues pendientes
            nextData: {
                headers: ["ID", "Placa", "Conductor", "Material", "Cantidad", "Inicio prog.", "Inicio real"],
                rows: carguesPendientes.map(c => ([
                    c.id,
                    c.placa,
                    c.conductor,
                    c.material,
                    c.cantidad + (c.unidad ? ` ${c.unidad}` : ''),
                    c.fecha_inicio_programada,
                    c.fecha_inicio_real
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

    },

    getCalendarData: async (req, res) => {
        const cargues = await cargueModel.getCarguesDesdeHoy();
        
        res.render("pages/admin/calendarioAdmin", {
            layout: "main",
            user: req.user,
            tittle: 'Calendario',
            carguesCalendario: JSON.stringify(cargues),
        });

    }
};
module.exports = adminController;