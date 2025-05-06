const cargueModel = require('../models/cargueModel');
const camionModel = require('../models/camionModel');
const clienteModel = require('../models/clienteModel');
const materialModel = require('../models/materialModel');
const usersModel = require('../models/usersModel');

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
        const tableHeaders = [
            { isEstado: true },
            { title: 'ID', sortField: 'id' },
            { title: 'Placa', sortField: 'placa' },
            { title: 'Conductor', sortField: 'conductor' },
            { title: 'Material', sortField: 'material' },
            { title: 'Cantidad', sortField: 'cantidad' },
            { title: 'Cliente', sortField: 'cliente' },
            { title: 'Fecha', sortField: 'fecha_inicio_programada' },
            { title: 'Inicio Prog.' }
        ];

        res.render("pages/admin/calendarioAdmin", {
            layout: "main",
            user: req.user,
            title: 'Calendario',
            carguesCalendario: JSON.stringify(cargues),
            success_msg: req.flash('success_msg')[0],
            tableHeaders,
            addButtonUrl: '/admin/agregar-cargue?referrer=calendario-admin',
        });
    },

    getCargueData: async (req, res) => {
        try {
            let cargue = await cargueModel.getCargueDetails(req.params.id);
            const conductor = await usersModel.findById(cargue.conductor_id);
            cargue.conductor_id = conductor.cedula;

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
                placa
            } = req.body;

            const cargue = await cargueModel.getCargueDetails(req.params.id);
            const conductor_id = await camionModel.getConductorByPlaca(placa);

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
                conductor_id: conductor_id,
                placa,
                user_id: req.user.id
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
            const cliente = await clienteModel.getClienteByDocumento(documento);
            if (cliente) {
                res.json(cliente);
            } else {
                res.status(404).json({ message: 'Cliente nox encontrado' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar cliente' });
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
                placa,
                user_id
            } = req.body;

            const codigo_material = await materialModel.getMaterialCodeByName(material_nombre.toLowerCase());
            const conductor_id = await camionModel.getConductorByPlaca(placa);

            const nuevoCargue = await cargueModel.addCargue({
                fecha_inicio_programada,
                fecha_fin_programada,
                codigo_material,
                cantidad,
                observaciones,
                documento,
                conductor_id: conductor_id,
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

    getUsersData: async (req, res) => {
        const usersData = await usersModel.getUsers();
        const tableHeaders = [
            { title: 'Usuario', sortField: 'nombre_usuario' },
            { title: 'Rol', sortField: 'rol' },
            { title: 'Cedula', sortField: 'cedula' },
            { title: 'Nombre', sortField: 'nombre' },
            { title: 'Teléfono', sortField: 'telefono' },
            { title: 'Correo', sortField: 'correo' },
            { title: 'Edad', sortField: 'edad' }
        ];

        res.render("pages/admin/usuarios", {
            layout: "main",
            user: req.user,
            title: 'Usuarios',
            usersData: JSON.stringify(usersData),
            success_msg: req.flash('success_msg')[0],
            tableHeaders,
            addButtonUrl: '/admin/agregar-usuario?referrer=usuarios'
        });
    },

    getTrucksData: async (req, res) => {
        const trucksData = await camionModel.getCamiones();
        const tableHeaders = [
            { title: 'Placa', sortField: 'placa' },
            { title: 'Tipo', sortField: 'tipo_camion' },
            { title: 'Capacidad', sortField: 'capacidad' },
            { title: 'Conductor', sortField: 'conductor_nombre' },
            { title: 'Cédula', sortField: 'conductor_cedula' },
            { title: 'Habilitado', sortField: 'habilitado' },
        ];

        res.render("pages/admin/camiones", {
            layout: "main",
            user: req.user,
            title: 'Camiones',
            trucksData: JSON.stringify(trucksData),
            success_msg: req.flash('success_msg')[0],
            tableHeaders,
            addButtonUrl: '/admin/agregar-camion?referrer=camiones'
        });
    },

    getClientsData: async (req, res) => {
        const clientsData = await clienteModel.getClientes();
        const tableHeaders = [
            { title: 'Documento', sortField: 'documento' },
            { title: 'Nombre', sortField: 'nombre' },
            { title: 'Dirección', sortField: 'direccion' },
            { title: 'Contacto', sortField: 'contacto' },
            { title: 'Correo', sortField: 'correo' },
        ];

        res.render("pages/admin/clientes", {
            layout: "main",
            user: req.user,
            title: 'Clientes',
            clientsData: JSON.stringify(clientsData),
            success_msg: req.flash('success_msg')[0],
            tableHeaders,
        });
    },

    postAddclient: async (req, res) => {
        try {
            const nuevoCliente = req.body;
            const exist = await clienteModel.getClienteByDocumento(nuevoCliente.documento); 
            
            if(exist){
                return res.status(400).json({ 
                    success: false, 
                    message: 'Ya existe un cliente con este documento',
                    field: 'documento'
                });
            }else {
                const resultado = await clienteModel.addCliente(nuevoCliente);
                if (resultado) {
                    req.flash('success_msg', 'Cliente añadido correctamente');
                    return res.status(200).json({ success: true, redirect: '/admin/clientes' });
                } else {
                    return res.status(400).json({ success: false, message: 'Error interno al agregar cliente' });
                }
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
    },

    postUpdateClient: async (req, res) => {
        console.log('Iniciando actualización de cliente...');
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        try {
            const { documento } = req.params; // Documento original que viene de la URL
            const clienteData = req.body; // Nuevos datos del cliente
            
            // 1. Verificar si el cliente existe
            const clienteExistente = await clienteModel.getClienteByDocumento(documento);
            if (!clienteExistente) {
                console.log('Cliente no encontrado con documento:', documento);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Cliente no encontrado'
                });
            }
            
            // 2. Si está intentando cambiar el documento, verificar que no exista otro con el nuevo documento
            if (documento !== clienteData.documento) {
                const documentoExistente = await clienteModel.getClienteByDocumento(clienteData.documento);
                if (documentoExistente) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Ya existe otro cliente con este nuevo documento',
                        field: 'documento'
                    });
                }
            }
            
            // 3. Actualizar el cliente
            const resultado = await clienteModel.updateCliente(documento, clienteData);
            
            if (resultado) {
                req.flash('success_msg', 'Cliente actualizado correctamente');
                return res.status(200).json({ 
                    success: true, 
                    redirect: '/admin/clientes' 
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No se realizaron cambios en el cliente' 
                });
            }
            
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error del servidor al actualizar cliente' 
            });
        }
    },

    getMaterialsData: async (req, res) => {
        const materials = await materialModel.getAllMaterials();
        const tableHeaders = [
            { title: 'Código', sortField: 'codigo' },
            { title: 'Nombre', sortField: 'nombre' },
            { title: 'Unidad de medida', sortField: 'unidad_medida' }
        ];

        res.render('pages/admin/materiales', {
            layout: 'main',
            user: req.user,
            title: 'Materiales',
            tableHeaders,
            materialsData: JSON.stringify(materials),
            addButtonUrl: '/admin/agregar-material'
        });
    },
};

module.exports = adminController;
