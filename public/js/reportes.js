document.addEventListener('DOMContentLoaded', function () {
    // 1. Manejo de selectores de fecha
    const desdeOpcion = document.getElementById('desde-opcion');
    const hastaOpcion = document.getElementById('hasta-opcion');
    const fechaInicio = document.getElementById('fecha-inicio');
    const fechaFin = document.getElementById('fecha-fin');

    // Habilitar/deshabilitar inputs de fecha
    function manejarSelectoresFecha() {
        fechaInicio.disabled = desdeOpcion.value !== 'custom';
        fechaFin.disabled = hastaOpcion.value !== 'custom';

        if (fechaInicio.disabled) fechaInicio.value = '';
        if (fechaFin.disabled) fechaFin.value = '';
    }

    desdeOpcion.addEventListener('change', manejarSelectoresFecha);
    hastaOpcion.addEventListener('change', manejarSelectoresFecha);

    // 2. Cargar jsPDF y AutoTable desde CDN
    function cargarLibreriasPDF() {
        return new Promise((resolve, reject) => {
            if (window.jspdf && window.jspdf.autotable) {
                resolve(window.jspdf);
                return;
            }

            const scriptJSPDF = document.createElement('script');
            scriptJSPDF.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

            scriptJSPDF.onload = () => {
                const scriptAutoTable = document.createElement('script');
                scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';

                scriptAutoTable.onload = () => {
                    resolve(window.jspdf);
                };

                scriptAutoTable.onerror = () => {
                    reject(new Error('Error al cargar jspdf-autotable'));
                };

                document.head.appendChild(scriptAutoTable);
            };

            scriptJSPDF.onerror = () => {
                reject(new Error('Error al cargar jspdf'));
            };

            document.head.appendChild(scriptJSPDF);
        });
    }

    // 3. Validación de fechas
    function validarFechas() {
        if (desdeOpcion.value === 'custom' && hastaOpcion.value === 'custom' &&
            fechaInicio.value && fechaFin.value && fechaInicio.value > fechaFin.value) {
            alert('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
            return false;
        }
        return true;
    }

    // 4. Obtener parámetros del formulario
    function obtenerParametros() {
        return {
            desde_opcion: desdeOpcion.value,
            hasta_opcion: hastaOpcion.value,
            fecha_inicio: fechaInicio.value,
            fecha_fin: fechaFin.value,
            ordenado: document.getElementById('ordenado').value,
            cliente: document.getElementById('cliente').value,
            camion: document.getElementById('camion').value,
            conductor: document.getElementById('conductor').value,
            incluir_cargues: document.getElementById('incluir-cargues').checked
        };
    }

    // 5. Generar PDF en el cliente
    async function generarPDFenCliente(cargues, accion) {
        try {
            await cargarLibreriasPDF();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Configuración del documento
            doc.setFontSize(18);
            doc.text('Reporte de Cargues', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

            // Encabezados de la tabla
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

            // Datos de la tabla
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

            // Generar tabla
            doc.autoTable({
                head: [headers],
                body: data,
                startY: 40,
                margin: { top: 40 },
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [22, 160, 133], // Verde
                    textColor: 255, // Blanco
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

            // Acción según botón presionado
            if (accion === 'preview') {
                // Previsualizar en nueva pestaña
                const pdfUrl = doc.output('bloburl');
                window.open(pdfUrl, '_blank');
            } else {
                // Descargar directamente
                doc.save(`reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
            }

        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el reporte: ' + error.message);
        }
    }

    // 6. Función principal para generar el reporte
    async function generarReporte(accion) {
        if (!validarFechas()) return;

        const params = obtenerParametros();

        try {
            // Mostrar loader (opcional)
            // document.getElementById('loader').style.display = 'block';

            const response = await fetch('/admin/api/reportes/generar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(response.statusText || 'Error al generar reporte');
            }

            const cargues = await response.json();
            await generarPDFenCliente(cargues, accion);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar el reporte: ' + error.message);
        } finally {
            // Ocultar loader (opcional)
            // document.getElementById('loader').style.display = 'none';
        }
    }

    // 7. Event Listeners para los botones
    document.querySelector('.btn-preview').addEventListener('click', function (e) {
        e.preventDefault();
        generarReporte('preview');
    });

    document.querySelector('.btn-download[type="submit"]').addEventListener('click', function (e) {
        e.preventDefault();
        generarReporte('download');
    });

    // Inicializar los selectores de fecha
    manejarSelectoresFecha();
});