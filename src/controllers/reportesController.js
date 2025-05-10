const reporteModel = require('../models/reporteModel.js');
const { generarPDF } = require('../middlewares/pdfService');

const reportesController = {
    generarPDF: async (req, res) => {
        try {
            const {
                desde_opcion,
                hasta_opcion,
                fecha_inicio,
                fecha_fin,
                ordenado,
                cliente,
                camion,
                conductor,
                incluir_cargues
            } = req.body;

            // Procesar fechas según las opciones seleccionadas
            let fechaDesde, fechaHasta;

            // Procesar fecha "Desde"
            if (desde_opcion === 'today') {
                fechaDesde = new Date().toISOString().split('T')[0];
            } else if (desde_opcion === 'custom' && fecha_inicio) {
                fechaDesde = fecha_inicio;
            } else {
                fechaDesde = null; // "Siempre"
            }

            // Procesar fecha "Hasta"
            if (hasta_opcion === 'today') {
                fechaHasta = new Date().toISOString().split('T')[0];
            } else if (hasta_opcion === 'custom' && fecha_fin) {
                fechaHasta = fecha_fin;
            } else {
                fechaHasta = null; // "Siempre"
            }

            // Obtener los cargues de la base de datos
            const cargues = await reporteModel.obtenerCargues({
                fechaDesde,
                fechaHasta,
                ordenado,
                cliente,
                camion,
                conductor,
                incluir_cargues
            });

            // Enviar los datos directamente al frontend
            res.json(cargues);
        } catch (error) {
            console.error('Error al generar el reporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar el reporte'
            });
        }
    },
};

module.exports = reportesController;