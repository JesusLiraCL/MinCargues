const cargueModel = require('../models/cargueModel');
const camionModel = require('../models/camionModel');
const clienteModel = require('../models/clienteModel');
const conductorModel = require('../models/conductorModel');
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

        // Función para obtener solo hora de la fecha
        const formatTime = (dateString) => {
            if (!dateString) return '';
            const [fecha, hora24] = dateString.split(' ');
            const hora = new Date(`2000-01-01T${hora24}`);
            return hora.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }).toLowerCase();
        };
        console.log(req.user);
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
                    formatTime(c.fecha_inicio_programada),
                    formatTime(c.fecha_inicio_real),
                ]))
            },

            // Tabla de cargues pendientes
            nextData: {
                headers: ["ID", "Placa", "Conductor", "Material", "Cantidad", "Inicio prog.", "Fin prog."],
                rows: carguesPendientes.map(c => ([
                    c.id,
                    c.placa,
                    c.conductor,
                    c.material,
                    c.cantidad + (c.unidad ? ` ${c.unidad}` : ''),
                    formatTime(c.fecha_inicio_programada),
                    formatTime(c.fecha_fin_programada),
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
            title: 'Calendario',
            carguesCalendario: JSON.stringify(cargues),
            success_msg: req.flash('success_msg')[0],
        });
    },

    getCargueData: async (req, res) => {
        try {
            const cargue = await cargueModel.getCargueDetails(req.params.id);
            res.render("pages/admin/cargueDetails", {
                layout: "main",
                user: req.user,
                title: "Detalles del Cargue",
                cargue: cargue
            });
        } catch (error) {
            console.error('Error al obtener detalles del cargue:', error);
            res.redirect('/admin/calendario-admin');
        }
    },

    postCargueUpdate: async (req, res) => {
        try {
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

            const cargue = await cargueModel.getCargueDetails(req.params.id);

            // Validaciones
            if (cargue.estado === 'en progreso') {
                return res.json({ success: false, message: 'No se pueden modificar los datos mientras el cargue está en progreso' });
            } else if (cargue.estado === 'completado') {
                return res.json({ success: false, message: 'El cargue ya ha sido realizado' });
            }

            const codigo_material = await materialModel.getMaterialCodeByName(material_nombre.toLowerCase());
            if (!codigo_material) {
                return res.json({ success: false, message: 'Material no encontrado' });
            }

            // Actualizar el cargue
            const result = await cargueModel.updateCargue(req.params.id, {
                fecha_inicio_programada: fecha_inicio_programada,
                fecha_fin_programada: fecha_fin_programada,
                codigo_material,
                cantidad,
                estado,
                observaciones,
                documento,
                cedula,
                placa
            });

            if (result) {
                res.json({ success: true });
            } else {
                res.json({ success: false, message: 'Error al actualizar el cargue' });
            }
        } catch (error) {
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
            res.redirect(`/admin/cargueDetails/${req.params.id}`);
        }
    },

    // APIs
    fetchCliente: async (req, res) => {
        try {
            const { documento } = req.query;
            console.log("documento: ", documento);
            const cliente = await clienteModel.getClienteByDocumento(documento);
            console.log("cliente: ", cliente);
            if (cliente) {
                res.json(cliente);
            } else {
                res.status(404).json({ message: 'Cliente nox encontrado' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar cliente' });
        }
    },

    fetchConductor: async (req, res) => {
        try {
            const { cedula } = req.query;
            const conductor = await conductorModel.getConductorByCedula(cedula);
            if (conductor) {
                res.json(conductor);
            } else {
                res.status(404).json({ message: 'Conductor no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar conductor' });
        }
    },

    fetchCamion: async (req, res) => {
        try {
            const { placa } = req.query;
            const camion = await camionModel.getCamionByPlaca(placa);
            if (camion) {
                res.json(camion);
            } else {
                res.status(404).json({ message: 'Camión no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar camión' });
        }
    },

    getAddCargue: async (req, res) => {
        res.render('pages/admin/addCargue', {
            layout: 'main',
            user: req.user,
            title: 'Agregar Cargue'
        })
    },

    postAddCargue: async (req, res) => {
        try {
            const {
                fecha_inicio_programada,
                fecha_fin_programada,
                material_nombre,
                cantidad,
                observaciones,
                documento,
                cedula,
                placa,
                user_id
            } = req.body;

            const codigo_material = await materialModel.getMaterialCodeByName(material_nombre.toLowerCase());

            const nuevoCargue = await cargueModel.addCargue({
                fecha_inicio_programada,
                fecha_fin_programada,
                codigo_material,
                cantidad,
                observaciones,
                documento,
                cedula,
                placa,
                user_id
            });

            // Respuesta exitosa en formato JSON
            return res.json({
                success: true,
                message: 'Cargue creado exitosamente',
                cargueId: nuevoCargue.id
            });

        } catch (error) {
            console.error('Error en agregarCargue:', error);
        }
    },
};

module.exports = adminController;

