const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const { default: autoTable } = require('jspdf-autotable');
const nodemailer = require('nodemailer');

const pdfDir = path.join(__dirname, '../../public/reportes');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

// Función para formatear fecha CON hora (para la tabla)
function formatFecha(fechaString) {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return fecha.toLocaleString('es-CO', options)
        .replace(',', '')
        .replace('a. m.', 'a.m.')
        .replace('p. m.', 'p.m.');
}

// Función para formatear fecha SIN hora (para el subtítulo)
function formatFechaSoloDia(fechaString) {
    if (!fechaString) return 'N/A';
    const [year, month, day] = fechaString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
}

async function generarPDF(cargues, isPreview, filtros = {}) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new jsPDF();
            const logoPath = path.join(__dirname, '../../public/img/logo_no_fondo.png');

            // Agregar logo (igual que en reportes.js)
            if (fs.existsSync(logoPath)) {
                const logoData = fs.readFileSync(logoPath);
                const logoBase64 = logoData.toString('base64');
                doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
            }

            // Texto de la empresa (igual que en reportes.js)
            doc.setFont("times", "bold");
            doc.setFontSize(25);
            doc.setTextColor(44, 62, 80);
            doc.text('MinMetal', 35, 20);

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text('MINERAL & METAL RESOURCES', 35, 25);

            // Fecha de emisión (igual que en reportes.js)
            doc.setFontSize(10).setFont("times", "bold");
            doc.text(`Fecha de emisión: ${formatFecha(new Date())}`, 195, 20, { align: 'right' });

            // Título del reporte (igual que en reportes.js)
            doc.setFontSize(14).setFont("times", "bold");
            doc.text('Reporte de Cargues', 105, 40, { align: 'center' });

            // Subtitulo dinámico
            let textoFechas = '';
            const desdeOpt = filtros.desdeOpcion || 'always';
            const hastaOpt = filtros.hastaOpcion || 'always';

            if (desdeOpt === 'today' && hastaOpt === 'today') {
                textoFechas = `Reporte del día: ${formatFechaSoloDia(new Date().toISOString())}`;
            } else if (desdeOpt === 'always' && hastaOpt === 'always') {
                textoFechas = 'Desde: inicio de registros - Hasta: sin fecha límite';
            } else if ((filtros.fechaDesde && filtros.fechaHasta) &&
                (formatFechaSoloDia(filtros.fechaDesde) === formatFechaSoloDia(filtros.fechaHasta))) {
                textoFechas = `Reporte del día: ${formatFechaSoloDia(filtros.fechaDesde)}`;
            } else {
                let textoDesde = '';
                let textoHasta = '';

                if (desdeOpt === 'today') {
                    textoDesde = `Desde: ${formatFechaSoloDia(new Date().toISOString())}`;
                } else if (desdeOpt === 'always') {
                    textoDesde = 'Desde: inicio de registros';
                } else if (desdeOpt === 'custom' && filtros.fechaDesde) {
                    textoDesde = `Desde: ${formatFechaSoloDia(filtros.fechaDesde)}`;
                }

                if (hastaOpt === 'today') {
                    textoHasta = `Hasta: ${formatFechaSoloDia(new Date().toISOString())}`;
                } else if (hastaOpt === 'always') {
                    textoHasta = 'Hasta: sin fecha límite';
                } else if (hastaOpt === 'custom' && filtros.fechaHasta) {
                    textoHasta = `Hasta: ${formatFechaSoloDia(filtros.fechaHasta)}`;
                }

                textoFechas = `${textoDesde} - ${textoHasta}`;
            }

            doc.setFontSize(10).setFont("times", "normal");
            doc.text(textoFechas, 105, 45, { align: 'center' });
            // Resto del código de la tabla (igual que en reportes.js)
            const headers = [
                'N°', 'ID', 'Placa', 'Cliente', 'Documento',
                'Conductor', 'Cédula', 'Material', 'Cantidad', 'Inicio Prog.'
            ];

            const data = cargues.map((c, index) => [
                index + 1,
                c.id,
                c.placa,
                c.nombre_cliente || 'N/A',
                c.documento || 'N/A',
                c.nombre_conductor || 'N/A',
                c.cedula_conductor || 'N/A',
                c.nombre_material || c.codigo_material || 'N/A',
                c.cantidad,
                formatFecha(c.fecha_inicio_programada)
            ]);

            autoTable(doc, {
                startY: 55,
                head: [headers],
                body: data,
                margin: { left: 15, right: 15 },
                tableWidth: 'auto',
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [244, 134, 52],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 8 },
                    1: { cellWidth: 10 },
                    2: { cellWidth: 18 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 18 },
                    7: { cellWidth: 18 },
                    8: { cellWidth: 18 },
                    9: { cellWidth: 25 }
                }
            });

            if (isPreview) {
                // Si es vista previa, guardar en archivo y devolver URL
                const filename = `reporte_${Date.now()}.pdf`;
                const filePath = path.join(pdfDir, filename);
                const pdfUrl = `/reportes/${filename}`;

                fs.writeFileSync(filePath, doc.output('arraybuffer'));
                resolve(pdfUrl);
            } else {
                // Si no es vista previa, devolver el buffer directamente
                resolve(doc.output('arraybuffer'));
            }
        } catch (error) {
            console.error('Error al generar PDF:', error);
            reject(error);
        }
    });
}

async function enviarReportePorCorreo(destinatario) {
    try {
        // Obtener fecha de hoy formateada para la BD (YYYY-MM-DD)
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0];

        // Generar el reporte del día actual
        const cargues = await require('../models/reporteModel').obtenerCargues({
            fechaDesde: `${fechaHoy} 00:00:00`,
            fechaHasta: `${fechaHoy} 23:59:59`,
            incluir_cargues: true,
            ordenado: 'fecha'
        });

        // Generar el PDF
        const pdfBuffer = await generarPDF(cargues, false, {
            desdeOpcion: 'today',
            hastaOpcion: 'today'
        });

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Obtener la fecha actual formateada
        const fecha = new Date().toLocaleDateString('es-CO');

        // Enviar el correo
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: destinatario,
            subject: `Reporte diario de cargues - ${fecha}`,
            text: `Adjunto encontrará el reporte diario de cargues generado el ${fecha}`,
            attachments: [{
                filename: `reporte_cargues_${fecha.replace(/\//g, '-')}.pdf`,
                content: Buffer.from(pdfBuffer)
            }]
        });

        console.log('Reporte enviado exitosamente por correo');
        return true;
    } catch (error) {
        console.error('Error al enviar el reporte por correo:', error);
        return false;
    }
}

module.exports = {
    generarPDF,
    enviarReportePorCorreo
};