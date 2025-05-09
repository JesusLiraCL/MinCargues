const cargueModel = require('../models/cargueModel');
const camionModel = require('../models/camionModel');
const clienteModel = require('../models/clienteModel');
const materialModel = require('../models/materialModel');
const usersModel = require('../models/usersModel');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

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
        console.log(usersData);
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
        });
    },

    postAddUser: async (req, res) => {
        try {
            const {
                nombre_usuario,
                cedula,
                nombre,
                edad,
                telefono,
                correo,
                rol,
                contrasena
            } = req.body;

            console.log(contrasena);
            // Verificar si el usuario ya existe
            const usuarioExistente = await usersModel.findByUsername(nombre_usuario);
            if (usuarioExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un usuario con este nombre de usuario',
                    field: 'nombre_usuario'
                });
            }

            // Verificar si la cédula ya está registrada
            const cedulaExistente = await usersModel.findByCedula(cedula);
            if (cedulaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un usuario con esta cédula',
                    field: 'cedula'
                });
            }

            // Encriptar la contraseña
            const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

            // Crear el nuevo usuario
            const nuevoUsuario = await usersModel.createUser({
                nombre_usuario,
                cedula,
                nombre,
                edad,
                telefono,
                correo,
                rol,
                contrasena: hashedPassword
            });

            if (nuevoUsuario) {
                req.flash('success_msg', 'Usuario creado exitosamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/usuarios'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Error al crear el usuario'
                });
            }
        } catch (error) {
            console.error('Error al agregar usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor al agregar usuario'
            });
        }
    },

    postUpdateUser: async (req, res) => {
        try {
            const { nombre_usuario } = req.params;
            const userData = req.body;

            // Verificar si el usuario existe
            const usuarioExistente = await usersModel.findByUsername(nombre_usuario);
            if (!usuarioExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si se está cambiando el nombre de usuario y ya existe
            if (userData.nombre_usuario && userData.nombre_usuario !== nombre_usuario) {
                const usuarioExistente = await usersModel.findByUsername(userData.nombre_usuario);
                if (usuarioExistente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un usuario con ese nombre de usuario',
                        field: 'nombre_usuario'
                    })
                }
            }

            // Verificar si se está cambiando la cédula y si ya existe
            if (userData.cedula && userData.cedula !== usuarioExistente.cedula) {
                const cedulaExistente = await usersModel.findByCedula(userData.cedula);
                if (cedulaExistente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un usuario con esta cédula',
                        field: 'cedula'
                    });
                }
            }

            // Actualizar el usuario
            const resultado = await usersModel.updateUser(nombre_usuario, userData);

            if (resultado) {
                req.flash('success_msg', 'Usuario actualizado exitosamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/usuarios'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se realizaron cambios en el usuario'
                });
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor al actualizar usuario'
            });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { nombre_usuario } = req.params;

            // Verificar si el usuario existe
            const usuarioExistente = await usersModel.findByUsername(nombre_usuario);
            if (!usuarioExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Intentar eliminar el usuario
            const eliminado = await usersModel.deleteUser(nombre_usuario);

            if (eliminado) {
                req.flash('success_msg', 'Usuario eliminado exitosamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/usuarios'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el usuario'
                });
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);

            if (error.code === '23503') {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar el usuario porque está asociado a uno o más registros existentes'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error del servidor al eliminar usuario'
            });
        }
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
        });
    },

    postAddTruck: async (req, res) => {
        try {
            const nuevoCamion = req.body;

            // Verificar si ya existe un camión activo con esa placa
            const existente = await camionModel.getCamionByPlaca(nuevoCamion.placa);

            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un camión activo con esta placa',
                    field: 'placa'
                });
            }

            // Obtener ID del conductor si se proporcionó cédula
            let conductorId = null;
            if (nuevoCamion.conductor_cedula) {
                const conductor = await usersModel.findByCedula(nuevoCamion.conductor_cedula);
                if (!conductor) {
                    return res.status(400).json({
                        success: false,
                        message: 'Conductor no encontrado',
                        field: 'conductor_cedula'
                    });
                }
                conductorId = conductor.id;
            }

            const resultado = await camionModel.addCamion({
                ...nuevoCamion,
                conductor_id: conductorId
            });

            if (resultado) {
                req.flash('success_msg', 'Camión añadido correctamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/camiones'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Error interno al agregar camión'
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor'
            });
        }
    },

    postUpdateTruck: async (req, res) => {
        try {
            const { placa } = req.params;
            const camionData = req.body;

            // 1. Verificar si el camión existe
            const camionExistente = await camionModel.getCamionByPlaca(placa);
            if (!camionExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Camión no encontrado'
                });
            }

            // 2. Si está intentando cambiar la placa, verificar que no exista otro con la nueva placa
            if (placa !== camionData.placa) {
                const placaExistente = await camionModel.getCamionByPlaca(camionData.placa);
                if (placaExistente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe otro camión con esta nueva placa',
                        field: 'placa'
                    });
                }
            }

            // Obtener ID del conductor si se proporcionó cédula
            let conductorId = camionExistente.conductor_id; // Mantener el actual por defecto
            if (camionData.conductor_cedula) {
                const conductor = await usersModel.findByCedula(camionData.conductor_cedula);
                if (!conductor) {
                    return res.status(400).json({
                        success: false,
                        message: 'Conductor no encontrado',
                        field: 'conductor_cedula'
                    });
                }
                conductorId = conductor.id;
            } else if ('conductor_cedula' in camionData && !camionData.conductor_cedula) {
                // Si se envía explícitamente vacío, quitar conductor
                conductorId = null;
            }

            // 3. Actualizar el camión
            const resultado = await camionModel.updateCamion(placa, {
                ...camionData,
                conductor_id: conductorId
            });

            if (resultado) {
                req.flash('success_msg', 'Camión actualizado correctamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/camiones'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se realizaron cambios en el camión'
                });
            }
        } catch (error) {
            console.error('Error al actualizar camión:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor al actualizar camión'
            });
        }
    },

    deleteTruck: async (req, res) => {
        try {
            const { placa } = req.params;

            // Verificar si el camión existe antes de eliminarlo
            const camionExistente = await camionModel.getCamionByPlaca(placa);
            if (!camionExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Camión no encontrado'
                });
            }

            // Intentar eliminar el camión (soft delete)
            const eliminado = await camionModel.deleteCamion(placa);

            if (eliminado) {
                req.flash('success_msg', 'Camión eliminado exitosamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/camiones'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el camión'
                });
            }
        } catch (error) {
            console.error('Error al eliminar camión:', error);

            return res.status(500).json({
                success: false,
                message: 'Error del servidor al eliminar camión'
            });
        }
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

            if (exist) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un cliente con este documento',
                    field: 'documento'
                });
            } else {
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

    deleteCliente: async (req, res) => {
        console.log("intentando eliminar cliente");
        try {
            const { documento } = req.params;

            // Verificar si el cliente existe antes de eliminarlo
            const clienteExistente = await clienteModel.getClienteByDocumento(documento);
            if (!clienteExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Intentar eliminar el cliente
            const eliminado = await clienteModel.deleteCliente(documento);

            if (eliminado) {
                req.flash('success_msg', 'Cliente eliminado exitosamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/clientes'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el cliente'
                });
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);

            if (error.code === '23503') {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar el cliente porque está asociado a uno o más cargues existentes'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error del servidor al eliminar cliente'
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
        });
    },

    postAddMaterial: async (req, res) => {
        try {
            const nuevoMaterial = req.body;

            // Validar que los datos requeridos estén presentes
            if (!nuevoMaterial.nombre || !nuevoMaterial.unidad_medida) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre y la unidad de medida son obligatorios'
                });
            }

            // Normalizar el nombre del material
            const nombreNormalizado = nuevoMaterial.nombre.toLowerCase().trim();

            // Verificar si ya existe un material activo con el mismo nombre
            const codigoExistente = await materialModel.getMaterialCodeByName(nombreNormalizado);
            if (codigoExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un material activo con este nombre',
                    field: 'nombre'
                });
            }

            // Verificar si existe un material eliminado con el mismo nombre
            const materialEliminado = await materialModel.getEliminadoByNombre(nombreNormalizado);
            if (materialEliminado) {
                console.log('Material eliminado encontrado:', materialEliminado);

                // Restaurar el material eliminado
                const resultado = await materialModel.updateMaterial(
                    materialEliminado.codigo,
                    {
                        nombre: nombreNormalizado, // Asegúrate de pasar el nombre normalizado
                        unidad_medida: nuevoMaterial.unidad_medida,
                        eliminado: false // Reactivar el material
                    }
                );

                if (resultado) {
                    console.log('Material restaurado:', resultado);
                    req.flash('success_msg', 'Material restaurado correctamente');
                    return res.status(200).json({
                        success: true,
                        redirect: '/admin/materiales'
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Error al restaurar el material'
                    });
                }
            }

            // Crear un nuevo material
            const resultado = await materialModel.addMaterial({
                nombre: nombreNormalizado,
                unidad_medida: nuevoMaterial.unidad_medida
            });

            if (resultado) {
                req.flash('success_msg', 'Material añadido correctamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/materiales'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Error interno al agregar material'
                });
            }
        } catch (error) {
            console.error('Error en postAddMaterial:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor'
            });
        }
    },

    postUpdateMaterial: async (req, res) => {
        try {
            const nombreMaterial = req.params.codigo; // Aquí realmente llega el nombre del material
            const materialData = req.body;

            // Validar que los datos requeridos estén presentes
            if (!materialData.nombre || !materialData.unidad_medida) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre y la unidad de medida son obligatorios'
                });
            }

            // Normalizar el nombre del material
            const nombreNormalizado = materialData.nombre.toLowerCase().trim();

            // Obtener el material existente por su nombre
            const materialExistente = await materialModel.getMaterialCodeByName(nombreMaterial.toLowerCase().trim());
            if (!materialExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Material no encontrado'
                });
            }

            // Verificar si se está intentando cambiar el nombre
            if (nombreMaterial.toLowerCase().trim() !== nombreNormalizado) {
                // Verificar si ya existe otro material activo con el nuevo nombre
                const nombreExistente = await materialModel.getMaterialCodeByName(nombreNormalizado);
                if (nombreExistente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe otro material con este nombre',
                        field: 'nombre'
                    });
                }
            }

            // Actualizar el material
            const resultado = await materialModel.updateMaterial(materialExistente, {
                nombre: nombreNormalizado,
                unidad_medida: materialData.unidad_medida
            });

            if (resultado) {
                req.flash('success_msg', 'Material actualizado correctamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/materiales'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se realizaron cambios en el material'
                });
            }
        } catch (error) {
            console.error('Error al actualizar material:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor al actualizar material'
            });
        }
    },

    deleteMaterial: async (req, res) => {
        try {
            const nombreMaterial = req.params.codigo; // Aquí realmente llega el nombre del material

            // Obtener el código del material a partir del nombre
            const materialExistente = await materialModel.getMaterialCodeByName(nombreMaterial.toLowerCase().trim());
            if (!materialExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Material no encontrado'
                });
            }

            // Intentar eliminar el material (soft delete)
            const eliminado = await materialModel.deleteMaterial(materialExistente);

            if (eliminado) {
                req.flash('success_msg', 'Material eliminado exitosamente');
                return res.status(200).json({
                    success: true,
                    redirect: '/admin/materiales'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el material'
                });
            }
        } catch (error) {
            console.error('Error al eliminar material:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor al eliminar material'
            });
        }
    },
};

module.exports = adminController;