const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

// Importación CORRECTA de autoTable
const autoTable = require('jspdf-autotable');

// Directorio para almacenar los PDFs generados
const pdfDir = path.join(__dirname, '../public/reportes');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

async function generarPDF(cargues, isPreview) {
    return new Promise((resolve, reject) => {
        try {
            // Crear un nuevo documento PDF
            const doc = new jsPDF();

            // Agregar título
            doc.setFontSize(18);
            doc.text('Reporte de Cargues', 105, 20, { align: 'center' });

            // Agregar fecha de generación
            doc.setFontSize(10);
            doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

            // Definir columnas para la tabla (versión simplificada para mejor visualización)
            const headers = [
                'ID',
                'Placa',
                'Documento',
                'Material',
                'Cantidad',
                'Inicio Real',
                'Fin Real',
                'Estado'
            ];

            // Preparar los datos
            const data = cargues.map(c => [
                c.id,
                c.placa,
                c.documento,
                c.codigo_material,
                c.cantidad,
                c.fecha_inicio_real || 'N/A',
                c.fecha_fin_real || 'N/A',
                c.estado
            ]);

            // Configuración de la tabla usando autoTable directamente
            autoTable(doc, {
                startY: 40,
                head: [headers],
                body: data,
                margin: { top: 40 },
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [22, 160, 133],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 10 }, // ID
                    1: { cellWidth: 15 }, // Placa
                    2: { cellWidth: 20 }, // Documento
                    3: { cellWidth: 20 }, // Material
                    4: { cellWidth: 15 }, // Cantidad
                    5: { cellWidth: 20 }, // Inicio Real
                    6: { cellWidth: 20 }, // Fin Real
                    7: { cellWidth: 15 }  // Estado
                }
            });

            // Generar nombre único para el archivo
            const filename = `reporte_${Date.now()}.pdf`;
            const filePath = path.join(pdfDir, filename);
            const pdfUrl = `/reportes/${filename}`;

            // Guardar el PDF
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