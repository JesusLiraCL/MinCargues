const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');

const pdfDir = path.join(__dirname, '../../public/reportes');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

// Función para formatear fecha
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

async function generarPDF(cargues, isPreview, filtros = {}) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new jsPDF();
            const logoPath = path.join(__dirname, '../../public/img/logo_no_fondo.png');

            // Agregar logo
            if (fs.existsSync(logoPath)) {
                const logoData = fs.readFileSync(logoPath);
                const logoBase64 = logoData.toString('base64');
                doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20); // Tamaño aumentado a 20x20
            }

            // Texto de la empresa
            doc.setFont("times", "bold");
            doc.setFontSize(25); // Aumentado a 25px
            doc.setTextColor(44, 62, 80); // Color #2c3e50
            doc.text('MinMetal', 35, 20); // Posición ajustada

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0); // Negro normal
            doc.text('MINERAL & METAL RESOURCES', 35, 25); // Posición ajustada

            // Fecha de emisión
            doc.setFontSize(10).setFont("times", "bold");
            doc.text(`Fecha de emisión: ${formatFecha(new Date())}`, 195, 20, { align: 'right' }); // Posición ajustada

            // Título del reporte
            doc.setFontSize(14).setFont("times", "bold");
            doc.text('Reporte de Cargues', 105, 40, { align: 'center' }); // Posición ajustada

            // Rango de fechas con espacio adicional
            const fechaDesde = filtros.fechaDesde ? formatFecha(filtros.fechaDesde) : 'inicio de registros';
            const fechaHasta = filtros.fechaHasta ? formatFecha(filtros.fechaHasta) : 'sin fecha límite';
            doc.setFontSize(10).setFont("times", "normal");
            doc.text(`Desde: ${fechaDesde} - Hasta: ${fechaHasta}`, 105, 45, { align: 'center' });

            // Encabezados de la tabla
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

            // Datos de la tabla
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

            // Generar tabla con espacio adicional
            autoTable(doc, {
                startY: 55, // Espacio aumentado
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
                    3: { cellWidth: 18 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 20 },
                    7: { cellWidth: 20 },
                    8: { cellWidth: 18 },
                    9: { cellWidth: 25 }
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