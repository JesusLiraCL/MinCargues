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

    // En la función obtenerParametros(), asegúrate de que las fechas estén en formato YYYY-MM-DD
    function obtenerParametros() {
        return {
            desde_opcion: desdeOpcion.value,
            hasta_opcion: hastaOpcion.value,
            fecha_inicio: fechaInicio.value, // Formato YYYY-MM-DD
            fecha_fin: fechaFin.value,     // Formato YYYY-MM-DD
            ordenado: document.getElementById('ordenado').value,
            cliente: document.getElementById('cliente').value,
            camion: document.getElementById('camion').value,
            conductor: document.getElementById('conductor').value,
            incluir_cargues: document.getElementById('incluir-cargues').checked
        };
    }

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
            doc.autoTable({
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

            // Acción según botón presionado
            if (accion === 'preview') {
                const pdfUrl = doc.output('bloburl');
                window.open(pdfUrl, '_blank');
            } else {
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


// test 1 funcional (entre comillas)