const cargueModel = require('../models/cargueModel');
const camionModel = require('../models/camionModel');
const materialModel = require('../models/materialModel');

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
            success_msg: req.flash('success_msg')[0],
        });
    },

    getCargueData: async (req, res) => {
        try {
            const cargue = await cargueModel.getCargueDetails(req.params.id);
            res.render("pages/admin/cargue", {
                layout: "main",
                user: req.user,
                tittle: 'Cargue',
                cargue: cargue
            });
        } catch (error) {
            console.error('Error al obtener detalles del cargue:', error);
        }
    },

    postCargueUpdate: async (req, res) => {
        try {
            console.log('Datos recibidos:', req.body);
            const { 
                fecha_inicio_programada, 
                fecha_fin_programada, 
                material_nombre, 
                cantidad, 
                estado, 
                observaciones, 
                documento, 
                cedula, 
                placa 
            } = req.body;

            console.log('ID del cargue:', req.params.id); // Agregamos 
            const cargue = await cargueModel.getCargueDetails(req.params.id);

            // Validaciones
            if (cargue.estado === 'en progreso') {
                console.log('Error: Cargue en progreso'); // Agregamos 
                return res.json({ success: false, message: 'No se pueden modificar los datos mientras el cargue está en progreso' });
            }

            // Obtener el código de material
            const codigo_material = await materialModel.getMaterialCodeByName(material_nombre);
            if (!codigo_material) {
                console.log('Error: Material no encontrado');
                return res.json({ success: false, message: 'Material no encontrado' });
            }

            console.log('Actualizando cargue con código de material:', codigo_material);
            // Actualizar el cargue
            const result = await cargueModel.updateCargue(req.params.id, {
                fecha_inicio_programada,
                fecha_fin_programada,
                codigo_material,
                cantidad,
                estado,
                observaciones,
                documento,
                cedula,
                placa
            });

            console.log('Resultado de la actualización:', result);
            if (result) {
                res.json({ success: true, message: 'Cargue actualizado exitosamente' });
            } else {
                res.json({ success: false, message: 'Error al actualizar el cargue' });
            }
        } catch (error) {
            console.error('Error completo:', error);
            console.error('Error al actualizar el cargue:', error);
            res.json({ success: false, message: 'Error al actualizar el cargue' });
        }
    },

    deleteCargue: async (req, res) => {
        try {
            const id = req.params.id;
            
            await cargueModel.deleteCargue(id);

            // Redirigimos al calendario con un mensaje de éxito
            req.flash('success_msg', 'Cargue eliminado exitosamente');
            res.redirect('/admin/calendario-admin');
        } catch (error) {
            console.error('Error al eliminar cargue:', error);
            req.flash('error_msg', 'Error al eliminar el cargue');
            res.redirect(`/admin/cargue/${req.params.id}`);
        }
    },
};

module.exports = adminController;