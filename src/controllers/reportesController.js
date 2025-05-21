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
                ordenado = 'fecha_desc',
                cliente,
                camion,
                conductor,
                incluir_cargues
            } = req.body;

            // Función para convertir fecha local a formato BD (YYYY-MM-DD HH:MM:SS)
            const formatToDBDateTime = (dateString, startOfDay = true) => {
                if (!dateString) return null;

                const [day, month, year] = dateString.split('-');
                const date = new Date(`${year}-${month}-${day}`);

                if (startOfDay) {
                    return `${year}-${month}-${day} 00:00:00`;
                } else {
                    return `${year}-${month}-${day} 23:59:59`;
                }
            };

            // Procesar fechas según las opciones seleccionadas
            let fechaDesde, fechaHasta;

            // Procesar fecha "Desde"
            if (desde_opcion === 'today') {
                const hoy = new Date();
                const dia = String(hoy.getDate()).padStart(2, '0');
                const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                fechaDesde = `${hoy.getFullYear()}-${mes}-${dia} 00:00:00`;
            } else if (desde_opcion === 'custom' && fecha_inicio) {
                fechaDesde = formatToDBDateTime(fecha_inicio, true);
            } else {
                fechaDesde = null; // "Siempre"
            }

            // Procesar fecha "Hasta"
            if (hasta_opcion === 'today') {
                const hoy = new Date();
                const dia = String(hoy.getDate()).padStart(2, '0');
                const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                fechaHasta = `${hoy.getFullYear()}-${mes}-${dia} 23:59:59`;
            } else if (hasta_opcion === 'custom' && fecha_fin) {
                fechaHasta = formatToDBDateTime(fecha_fin, false);
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

            // Generar el PDF con los datos obtenidos
            const pdfBuffer = await generarPDF(
                {
                    desde_opcion,
                    hasta_opcion,
                    fecha_inicio: fechaDesde,
                    fecha_fin: fechaHasta,
                    cliente,
                    camion,
                    conductor,
                    incluir_cargues
                },
                ordenado,
                false
            );

            // Configurar los encabezados de la respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte_cargues.pdf');
            
            // Enviar el PDF como respuesta
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Error al generar el reporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar el reporte',
                error: error.message
            });
        }
    },
};

module.exports = reportesController;