const clienteModel = require('../models/clienteModel');
const conductorModel = require('../models/conductorModel');
const camionModel = require('../models/camionModel');
const materialModel = require('../models/materialModel');
const cargueModel = require('../models/cargueModel');

const validateCargue = async (req, res, next) => {
    try {
        const {
            cantidad,
            documento,
            cedula,
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
        const fecha_inicio_bd = cargueModel.getStartDate(req.params.id);
        if (fecha_inicio_programada == fecha_inicio_bd && startDate <= today) {
            errors.messageInvalidStartDate = 'La fecha de inicio debe ser mayor a la fecha actual';
        }

        // Validar que la fecha de fin sea mayor a la de inicio
        if (fecha_inicio_programada && fecha_fin_programada && endDate <= startDate) {
            errors.messageInvalidEndDate = 'La fecha de fin debe ser mayor a la fecha de inicio';
        }

        const camion = await camionModel.getCamionByPlaca(placa);
        if (placa != '') {
            if (!camion) {
                errors.messageNoCamion = 'Camión no encontrado';
            } else if (cantidad > camion.capacidad) {
                errors.messageCantidad = 'La cantidad supera la capacidad del camión';
            }
        } else {
            errors.messageNoCamion = "El campo 'Placa' no puede estar vacío";
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

        const conductor = await conductorModel.getConductorByCedula(cedula);
        if (cedula) {
            if (!conductor) {
                errors.messageNoConductor = 'Conductor no encontrado';
            }
        } else {
            errors.messageNoConductor = "El campo 'Cédula' no puede estar vacío";
        }

        if (!cantidad) {
            errors.messageNoCantidad = "El campo 'Cantidad' no puede estar vacío";
        }

        // 3. Check conductor and camion availability (only if they exist)
        if (conductor && camion) {
            const inicioDate = new Date(fecha_inicio_programada);
            const finDate = new Date(fecha_fin_programada);
            const inicioWithBuffer = new Date(inicioDate.getTime() - 9 * 60000);
            const finWithBuffer = new Date(finDate.getTime() + 9 * 60000);

            const conductorCargues = await cargueModel.getCarguesByConductor({
                cedula: cedula,
                inicioWithBuffer,
                finWithBuffer,
                currentId: req.params.id,
            });

            if (conductorCargues.length > 0) {
                errors.messageConductorNoDisponible =
                    `El conductor ya tiene un cargue programado en este periodo (n° ${conductorCargues[0].id})`;
            }

            const camionCargues = await cargueModel.getCarguesByCamion({
                placa: placa,
                inicioWithBuffer,
                finWithBuffer,
                currentId: req.params.id,
            });

            if (camionCargues.length > 0) {
                errors.messageCamionNoDisponible =
                    `El camión ya está asignado a otro cargue en este periodo (n° ${camionCargues[0].id})`;
            }
        }

        // If there are errors, redirect with the error messages as query parameters
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error inesperado al validar el cargue'
        });
    }
};

module.exports = { validateCargue };