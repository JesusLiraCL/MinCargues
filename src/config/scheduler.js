const schedule = require('node-schedule');
const { enviarReportePorCorreo } = require('../middlewares/pdfService');

function iniciarScheduler(correoDestino) {
    // Para pruebas: cada 5 minutos
    schedule.scheduleJob('*/5 * * * *', async function() {
        console.log('Iniciando generación y envío programado del reporte...');
        await enviarReportePorCorreo(correoDestino);
    });

    // Producción: una vez al día a las 23:59
    // schedule.scheduleJob('59 23 * * *', async function() {
    //     console.log('Iniciando generación y envío programado del reporte...');
    //     await enviarReportePorCorreo(correoDestino);
    // });
}

module.exports = { iniciarScheduler };
