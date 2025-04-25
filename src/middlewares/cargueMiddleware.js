const clienteModel = require('../models/clienteModel');
const conductorModel = require('../models/conductorModel');
const camionModel = require('../models/camionModel');
const cargueModel = require('../models/cargueModel');

const validateCargue = async (req, res, next) => {
    try {
        const {
            cantidad,
            documento,
            cedula,
            placa,
            fecha_inicio_programada,
            fecha_fin_programada
        } = req.body;
        console.log("Body: ", req.body);

        // 1. Validate truck capacity
        const camion = await camionModel.getCamionByPlaca(placa);
        if (!camion) {
            return res.status(400).json({ 
                success: false, 
                message: 'Camión no encontrado' 
            });
        }

        if (cantidad > camion.capacidad) {
            console.log(camion.capacidad);
            console.log('La cantidad supera la capacidad del camión');
            return res.status(400).json({ 
                success: false,
                message: 'La cantidad supera la capacidad del camión' 
            });
        }

        // 2. Validate existence of cliente, conductor, and camion
        const cliente = await clienteModel.getClienteByDocumento(documento);
        const conductor = await conductorModel.getConductorByCedula(cedula);
        
        if (!cliente) {
            console.log('Cliente no encontrado');
            return res.status(400).json({ 
                success: false, 
                message: 'Cliente no encontrado' 
            });
        }

        if (!conductor) {
            console.log('Conductor no encontrado');
            return res.status(400).json({ 
                success: false, 
                message: 'Conductor no encontrado' 
            });
        }

        // 3. Check conductor and camion availability
        const inicioDate = new Date(fecha_inicio_programada);
        const finDate = new Date(fecha_fin_programada);

        // Add 10 minutes before and after the current cargue
        const inicioWithBuffer = new Date(inicioDate.getTime() - 10 * 60000);
        const finWithBuffer = new Date(finDate.getTime() + 10 * 60000);

        // Check for overlapping cargues for conductor
        const conductorCargues = await cargueModel.getCarguesByConductor({
            cedula: cedula,
            inicioWithBuffer,
            finWithBuffer
        });

        if (conductorCargues.length > 0) {
            console.log('El conductor ya tiene un cargue programado en este periodo');
            return res.status(400).json({ 
                success: false, 
                message: 'El conductor ya tiene un cargue programado en este periodo' 
            });
        }

        // Check for overlapping cargues for camion
        const camionCargues = await cargueModel.getCarguesByCamion({
            placa: placa,
            inicioWithBuffer,
            finWithBuffer
        });

        if (camionCargues.length > 0) {
            console.log('El camión ya está asignado a otro cargue en este periodo');
            return res.status(400).json({ 
                success: false, 
                message: 'El camión ya está asignado a otro cargue en este periodo' 
            });
        }

        // If all validations pass, continue to the next middleware/route handler
        next();
    } catch (error) {
        console.error('Error en validación de cargue:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en validación de cargue' 
        });
    }
};

module.exports = { validateCargue };