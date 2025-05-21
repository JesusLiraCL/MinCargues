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

    function formatFechaSoloDia(fechaString) {
        if (!fechaString) return 'N/A';

        /* Parseo manual para evitar problemas de zona horaria
        const [year, month, day] = fechaString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
        */

        // usando formato local
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    async function generarPDFenCliente(cargues, accion, parametros = {}) {
        try {
            await cargarLibreriasPDF();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const params = { ...obtenerParametros(), ...parametros };
            // Cargar logo
            const logoImg = new Image();
            logoImg.src = '/img/logo_no_fondo.png';

            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });

            // Agregar logo
            if (logoImg.width > 0) {
                doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
            }

            // Texto de la empresa
            doc.setFont("times", "bold");
            doc.setFontSize(25); // Aumentado de 16 a 18
            doc.setTextColor(44, 62, 80); // Color #2c3e50
            doc.text('MinMetal', 35, 20);

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0); // Negro normal
            doc.text('MINERAL & METAL RESOURCES', 35, 25);

            // Fecha de emisión
            doc.setFontSize(10).setFont("times", "bold");
            doc.text(`Fecha de emisión: ${formatFecha(new Date())}`, 195, 20, { align: 'right' });

            // Título del reporte
            doc.setFontSize(14).setFont("times", "bold");
            doc.text('Reporte de Cargues', 105, 40, { align: 'center' });

            // Rango de fechas con espacio adicional
            doc.setFontSize(10).setFont("times", "normal");

            // Determinar el texto de fechas de manera inteligente
            let textoFechas = '';
            const desdeOpt = params.desde_opcion;
            const hastaOpt = params.hasta_opcion;

            if (desdeOpt === 'today' && hastaOpt === 'today') {
                // Si ambas fechas son hoy
                textoFechas = `Reporte del día: ${formatFecha(new Date()).slice(0, 10)}`;
            } else if (desdeOpt === 'always' && hastaOpt === 'always') {
                // Si es todo el rango histórico
                textoFechas = 'Desde: inicio de registros - Hasta: sin fecha límite';
            } else if ((params.fecha_inicio && params.fecha_fin) && (formatFechaSoloDia(params.fecha_inicio).slice(0, 10) === formatFechaSoloDia(params.fecha_fin).slice(0, 10))) {
                // Si ambas fechas son iguales
                textoFechas = `Reporte del día: ${formatFechaSoloDia(params.fecha_inicio).slice(0, 10)}`;
            } else {
                // Para otros casos, construir el texto según las opciones seleccionadas
                let textoDesde = '';
                let textoHasta = '';

                if (desdeOpt === 'today') {
                    textoDesde = `Desde: ${formatFecha(new Date()).slice(0, 10)}`;
                } else if (desdeOpt === 'always') {
                    textoDesde = 'Desde: inicio de registros';
                } else if (desdeOpt === 'custom' && params.fecha_inicio) {
                    textoDesde = `Desde: ${formatFechaSoloDia(params.fecha_inicio).slice(0, 10)}`;
                }

                if (hastaOpt === 'today') {
                    textoHasta = `Hasta: ${formatFecha(new Date()).slice(0, 10)}`;
                } else if (hastaOpt === 'always') {
                    textoHasta = 'Hasta: sin fecha límite';
                } else if (hastaOpt === 'custom' && params.fecha_fin) {
                    textoHasta = `Hasta: ${formatFechaSoloDia(params.fecha_fin).slice(0, 10)}`;
                }

                textoFechas = `${textoDesde} - ${textoHasta}`;
            }

            doc.text(textoFechas, 105, 45, { align: 'center' });
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

            // Generar tabla con espacio adicional después del rango de fechas
            doc.autoTable({
                startY: 55, // Aumentado de 50 a 55 para más espacio
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
    async function generarReporte(accion, parametros = {}) {
        if (!validarFechas()) return;

        // Combinar parámetros del formulario con los parámetros proporcionados
        const params = { ...obtenerParametros(), ...parametros };

        try {
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
            await generarPDFenCliente(cargues, accion, params); // Pasar los params usados

        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar el reporte: ' + error.message);
        }
    }

    // 7. Event Listeners para los botones
    document.querySelector('.report-header .btn-download').addEventListener('click', function (e) {
        e.preventDefault();
        // Crear parámetros para el reporte del día actual
        const parametros = {
            desde_opcion: 'today',
            hasta_opcion: 'today',
            ordenado: 'fecha',
            cliente: '',
            camion: '',
            conductor: '',
            incluir_cargues: true
        };

        generarReporte('download', parametros);
    });

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