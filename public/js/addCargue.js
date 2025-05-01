document.addEventListener('DOMContentLoaded', function () {
    function goBack() {
        const confirmGoBack = confirm('¿Está seguro que desea cancelar?');

        if (confirmGoBack) {
            const urlParams = new URLSearchParams(window.location.search);
            const referrer = urlParams.get('referrer') || 'inicio';
            window.location.href = `/admin/${referrer}`;
        }
    }

    document.getElementById('documento').addEventListener('change', async function () {
        const cliente = await fetchClienteByDocumento(this.value);
        if (cliente) {
            // Update cliente details in the UI
            document.getElementById('cliente_nombre').textContent = cliente.nombre || 'Nombre no disponible';
            document.getElementById('cliente_direccion').textContent = cliente.direccion || 'Dirección no disponible';
            document.getElementById('cliente_contacto').textContent = cliente.contacto || 'Contacto no disponible';
            document.getElementById('cliente_correo').textContent = cliente.correo || 'Correo no disponible';
        } else {
            document.getElementById('cliente_nombre').textContent = '';
            document.getElementById('cliente_direccion').textContent = '';
            document.getElementById('cliente_contacto').textContent = '';
            document.getElementById('cliente_correo').textContent = '';
        }
    });

    document.getElementById('placa').addEventListener('change', async function () {
        const camion = await fetchCamionByPlaca(this.value);
        if (camion) {
            // Actualizar datos del camión
            document.getElementById('camion_tipo').textContent = camion.tipo_camion || 'Tipo no disponible';
            document.getElementById('camion_capacidad').textContent = camion.capacidad || 'Capacidad no disponible';
            document.getElementById('camion_habilitado').textContent = camion.habilitado ? 'Sí' : 'No';
            
            // Actualizar datos del conductor asignado (nuevo)
            if (camion.conductor_id) {
                document.getElementById('conductor_cedula').textContent = camion.conductor_cedula || 'Cédula no disponible';
                document.getElementById('conductor_nombre').textContent = camion.conductor_nombre || 'Nombre no disponible';
                document.getElementById('conductor_edad').textContent = camion.conductor_edad || 'Edad no disponible';
                document.getElementById('conductor_telefono').textContent = camion.conductor_telefono || 'Teléfono no disponible';
                document.getElementById('conductor_correo').textContent = camion.conductor_correo || 'Correo no disponible';
            } else {
                // Limpiar campos si no hay conductor asignado
                document.getElementById('conductor_cedula').textContent = 'No posee conductor';
                document.getElementById('conductor_nombre').textContent = '';
                document.getElementById('conductor_edad').textContent = '';
                document.getElementById('conductor_telefono').textContent = '';
                document.getElementById('conductor_correo').textContent = '';
            }
        } else {
            // Limpiar todos los campos si no se encuentra el camión
            document.getElementById('camion_tipo').textContent = '';
            document.getElementById('camion_capacidad').textContent = '';
            document.getElementById('camion_habilitado').textContent = '';
            document.getElementById('conductor_cedula').textContent = '';
            document.getElementById('conductor_nombre').textContent = '';
            document.getElementById('conductor_edad').textContent = '';
            document.getElementById('conductor_telefono').textContent = '';
            document.getElementById('conductor_correo').textContent = '';
        }
    });

    function handleSubmit() {

        // Recolectar los datos del formulario
        const formData = {
            fecha_inicio_programada: document.getElementById('fecha_inicio_programada').value,
            fecha_fin_programada: document.getElementById('fecha_fin_programada').value,
            material_nombre: document.getElementById('material_nombre').value,
            cantidad: document.getElementById('cantidad').value,
            observaciones: document.getElementById('observaciones').value,
            documento: document.getElementById('documento').value,
            placa: document.getElementById('placa').value,
            user_id: document.querySelector('.cargue-details-container').dataset.userId
        };

        fetch('/admin/agregar-cargue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                // Limpiar errores anteriores
                document.querySelectorAll('.server-error').forEach(el => el.remove());

                if (data.success) {
                    alert('Cargue agregado exitosamente');
                    const urlParams = new URLSearchParams(window.location.search);
                    const referrer = urlParams.get('referrer') || 'inicio';
                    window.location.href = `/admin/${referrer}`;
                } else {
                    const errorMappings = {
                        messageNoCamion: { selector: '#placa' },
                        messageCantidad: { selector: '#cantidad' },
                        messageNoCantidad: { selector: '#cantidad' },
                        messageNoCliente: { selector: '#documento' },
                        messageNoMaterial: { selector: '#material_nombre' },
                        messageNoConductor: { selector: '#placa' },
                        messageCamionNoDisponible: { selector: '#fecha_inicio_programada' },
                        messageConductorNoDisponible: { selector: '#fecha_inicio_programada' },
                        messageInvalidStartDate: { selector: '#fecha_inicio_programada' },
                        messageInvalidEndDate: { selector: '#fecha_fin_programada' },
                    };

                    // Limpiar tooltips y clases de error anteriores
                    document.querySelectorAll('.error-tooltip').forEach(el => el.remove());
                    document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

                    // Agrupar errores por campo
                    const errorsByField = {};

                    Object.entries(data.errors).forEach(([errorKey, errorMessage]) => {
                        if (errorMappings[errorKey]) {
                            const selector = errorMappings[errorKey].selector;
                            if (!errorsByField[selector]) {
                                errorsByField[selector] = [];
                            }
                            errorsByField[selector].push(errorMessage);
                        }
                    });

                    // Mostrar errores en los campos correspondientes
                    Object.entries(errorsByField).forEach(([selector, errorMessages]) => {
                        const inputElement = document.querySelector(selector);
                        if (inputElement) {
                            // Marcar campo con error
                            inputElement.classList.add('has-error');

                            // Crear tooltip de error
                            const tooltipContainer = document.createElement('div');
                            tooltipContainer.className = 'error-tooltip';

                            // Ícono de error
                            const tooltipIcon = document.createElement('span');
                            tooltipIcon.id = 'error-tooltip-icon';
                            tooltipIcon.textContent = '!';

                            // Contenido del tooltip
                            const tooltipContent = document.createElement('div');
                            tooltipContent.className = 'error-tooltip-content';

                            const errorList = document.createElement('ul');
                            errorList.className = 'error-list';

                            errorMessages.forEach(message => {
                                const errorItem = document.createElement('li');
                                errorItem.textContent = message;
                                errorList.appendChild(errorItem);
                            });

                            tooltipContent.appendChild(errorList);
                            tooltipContainer.appendChild(tooltipIcon);
                            tooltipContainer.appendChild(tooltipContent);

                            // Insertar tooltip después del campo
                            inputElement.parentNode.insertBefore(tooltipContainer, inputElement.nextSibling);
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al agregar el cargue');
            });
    }

    const backButton = document.getElementById('btn-cancelar');
    backButton.addEventListener('click', goBack);

    const addButton = document.getElementById('btn-agregar');
    addButton.addEventListener('click', handleSubmit);

    function getLocalDatetimeString(date = new Date()) {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date - offset)
                              .toISOString()
                              .slice(0, 16);
        return localISOTime;
    }
    
    const fechaHoy = getLocalDatetimeString();

    document.getElementById('fecha_inicio_programada').value = fechaHoy;
    document.getElementById('fecha_fin_programada').value = fechaHoy;

    document.getElementById('fecha_inicio_programada').min = fechaHoy;
    document.getElementById('fecha_fin_programada').min = fechaHoy;
})