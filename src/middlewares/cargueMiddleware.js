const clienteModel = require('../models/clienteModel');
const camionModel = require('../models/camionModel');
const materialModel = require('../models/materialModel');
const cargueModel = require('../models/cargueModel');
const usersModel = require('../models/usersModel');


const validateCargue = async (req, res, next) => {
    try {
        const {
            cantidad,
            documento,
            placa,
            material_nombre,
            fecha_inicio_programada,
            fecha_fin_programada
        } = req.body;

        const errors = {};

        const today = new Date();
        const startDate = new Date(fecha_inicio_programada);
        const endDate = new Date(fecha_fin_programada);

        // Validar que la fecha de inicio sea mayor a la actual
        const fecha_inicio_bd = req.params.id ? await cargueModel.getStartDate(req.params.id) : null;
        if (fecha_inicio_programada && fecha_inicio_bd === fecha_inicio_programada && startDate <= today) {
            errors.messageInvalidStartDate = 'La fecha de inicio debe ser mayor a la fecha actual';
        }

        // Validar que la fecha de fin sea mayor a la de inicio
        if (fecha_inicio_programada && fecha_fin_programada && endDate <= startDate) {
            errors.messageInvalidEndDate = 'La fecha de fin debe ser mayor a la fecha de inicio';
        }

        // Demas validaciones
        if (!cantidad) errors.messageNoCantidad = "El campo 'Cantidad' no puede estar vacío";

        // Corrected placa validation
        const camion = await camionModel.getCamionByPlaca(placa);

        if (!placa) {
            errors.messageNoCamion = "El campo 'Placa' no puede estar vacío";
        } else {
            if (!camion) {
                errors.messageNoCamion = 'Camión no encontrado';
            } else {
                if (!camion.conductor_id) {
                    errors.messageNoConductor = 'El camión no tiene conductor asignado';
                }

                if (cantidad && camion.capacidad && cantidad > camion.capacidad) {
                    errors.messageCantidad = 'La cantidad supera la capacidad del camión';
                }
            }
        }

        if (material_nombre) {
            const material = await materialModel.getMaterialCodeByName(material_nombre.toLowerCase());
            if (!material) {
                errors.messageNoMaterial = 'Material no encontrado';
            }
        } else {
            errors.messageNoMaterial = "El campo 'Material' no puede estar vacío";
        }

        if (documento) {
            const cliente = await clienteModel.getClienteByDocumento(documento);
            if (!cliente) {
                errors.messageNoCliente = 'Cliente no encontrado';
            }
        } else {
            errors.messageNoCliente = "El campo 'Documento' no puede estar vacío";
        }

        // 3. Check conductor and camion availability (only if they exist)
        if (camion && camion.conductor_id) {
            const inicioDate = new Date(fecha_inicio_programada);
            const finDate = new Date(fecha_fin_programada);
            const inicioWithBuffer = new Date(inicioDate.getTime() - 9 * 60000);
            const finWithBuffer = new Date(finDate.getTime() + 9 * 60000);

            const conductorCargues = await cargueModel.getCarguesByConductor({
                conductor_id: camion.conductor_id,
                inicioWithBuffer,
                finWithBuffer,
                currentId: req.params.id || null,
            });

            if (conductorCargues.length > 0) {
                errors.messageConductorNoDisponible =
                    `El conductor ya tiene un cargue programado en este periodo (n° ${conductorCargues[0].id})`;
            }

            const camionCargues = await cargueModel.getCarguesByCamion({
                placa: placa,
                inicioWithBuffer,
                finWithBuffer,
                currentId: req.params.id || null,
            });

            if (camionCargues.length > 0) {
                errors.messageCamionNoDisponible =
                    `El camión ya está asignado a otro cargue en este periodo (n° ${camionCargues[0].id})`;
            }
        }

        // If there are errors, return with the error messages
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        next();

    } catch (error) {
        console.error('Error en validación de cargue:', error);
        return res.status(500).json({
            success: false,
            message: 'Error inesperado al validar el cargue',
            errorDetails: error.toString()
        });
    }
};

module.exports = { validateCargue };