const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');

const pdfDir = path.join(__dirname, '../public/reportes');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

// Función para formatear fecha
function formatFecha(fechaString) {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '');
}

async function generarPDF(cargues, isPreview) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new jsPDF();

            // Configuración del documento
            doc.setFontSize(18);
            doc.text('Reporte de Cargues', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generado el: ${formatFecha(new Date())}`, 105, 30, { align: 'center' });

            // Encabezados actualizados
            const headers = [
                'N°',
                'ID',
                'Placa',
                'Cliente',
                'Documento',
                'Conductor',
                'Cédula',
                'Material',
                'Cantidad',
                'Inicio Prog.'
            ];

            // Datos actualizados con fecha formateada
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

            // Generar tabla centrada
            autoTable(doc, {
                startY: 40,
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
                    0: { cellWidth: 8 },   // N°
                    1: { cellWidth: 10 },  // ID
                    2: { cellWidth: 18 },  // Placa (aumentada)
                    3: { cellWidth: 18 },  // Cliente
                    4: { cellWidth: 20 },  // Documento
                    5: { cellWidth: 25 },  // Conductor
                    6: { cellWidth: 20 },  // Cédula
                    7: { cellWidth: 20 },  // Material
                    8: { cellWidth: 18 },  // Cantidad
                    9: { cellWidth: 25 }   // Inicio Prog. (aumentada para fecha)
                }
            });

            const filename = `reporte_${Date.now()}.pdf`;
            const filePath = path.join(pdfDir, filename);
            const pdfUrl = `/reportes/${filename}`;

            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            fs.writeFileSync(filePath, pdfBuffer);

            resolve(pdfUrl);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            reject(error);
        }
    });
}

module.exports = { generarPDF };