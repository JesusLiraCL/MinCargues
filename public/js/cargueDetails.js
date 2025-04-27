document.addEventListener('DOMContentLoaded', function() {

    // listeners
    function goBack() {
        // Obtener el referrer de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('referrer') || 'inicio';
        
        // Redirigir a la página correspondiente
        window.location.href = `/admin/${referrer}`;
    }

    // Add event listeners for dynamic entity updates
    document.getElementById('documento').addEventListener('change', async function() {
        if (isEditing) {
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
        }
    });

    document.getElementById('cedula').addEventListener('change', async function() {
        if (isEditing) {
            const conductor = await fetchConductorByCedula(this.value);
            if (conductor) {
                // Update conductor details in the UI
                document.getElementById('conductor_nombre').textContent = conductor.nombre || 'Nombre no disponible';
                document.getElementById('conductor_edad').textContent = conductor.edad || 'Edad no disponible';
                document.getElementById('conductor_telefono').textContent = conductor.telefono || 'Teléfono no disponible';
                document.getElementById('conductor_correo').textContent = conductor.correo || 'Correo no disponible';
                // Add more fields as needed
            } else {
                document.getElementById('conductor_nombre').textContent = '';
                document.getElementById('conductor_edad').textContent = '';
                document.getElementById('conductor_telefono').textContent = '';
                document.getElementById('conductor_correo').textContent = '';
            }
        }
    });
    
    document.getElementById('placa').addEventListener('change', async function() {
        if (isEditing) {
            const camion = await fetchCamionByPlaca(this.value);
            if (camion) {
                // Update camion details in the UI
                document.getElementById('camion_tipo').textContent = camion.tipo_camion || 'Tipo no disponible';
                document.getElementById('camion_capacidad').textContent = camion.capacidad || 'Capacidad no disponible';
                document.getElementById('camion_habilitado').textContent = camion.habilitado ? 'Sí' : 'No';
            } else {
                document.getElementById('camion_tipo').textContent = '';
                document.getElementById('camion_capacidad').textContent = '';
                document.getElementById('camion_habilitado').textContent = '';
            }
        }
    });

    let isEditing = false;
    let cargueId = null;
    let cargueEstado = null;

    function confirmDelete() {
        if (isEditing) {
            // Si estamos en modo edición, cancelar cambios
            if (confirm('¿Estás seguro que deseas cancelar los cambios?')) {
                window.location.reload();
            }
        } else {
            // Si no estamos en modo edición, mostrar confirmación de eliminación
            if (confirm('¿Estás seguro que deseas eliminar este cargue?')) {
                window.location.href = `/admin/cargue/${cargueId}/delete`;
            }
        }
    }

    function toggleEditMode() {
        if (isEditing) {
            // Clear previous error messages (tanto de cliente como de servidor)
            document.querySelectorAll('.error-message').forEach(el => el.remove());

            const startDateInput = document.getElementById('fecha_inicio_programada');
            const endDateInput = document.getElementById('fecha_fin_programada');

            // Preparar datos para enviar al servidor
            const data = {
                fecha_inicio_programada: startDateInput.value,
                fecha_fin_programada: endDateInput.value,
                material_nombre: document.getElementById('material_nombre').value,
                cantidad: document.getElementById('cantidad').value,
                estado: document.getElementById('estado').value,
                observaciones: document.getElementById('observaciones').value,
                documento: document.getElementById('documento').value,
                cedula: document.getElementById('cedula').value,
                placa: document.getElementById('placa').value
            };
    
            // Enviar la solicitud al servidor independientemente de los errores de validación
            fetch(`/admin/cargue/${cargueId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    // Limpiar solo los errores del servidor anteriores
                    document.querySelectorAll('.server-error').forEach(el => el.remove());
    
                    if (data.success) {
                        alert('Cambios guardados exitosamente');
                        isEditing = false;
                        const editButton = document.querySelector('.btn-edit-save');
                        editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
                        editButton.classList.remove('btn-save');
                        editButton.classList.add('btn-edit');
                        document.querySelector('.btn-danger').innerHTML = '<i class="fas fa-trash"></i> Eliminar';
                        document.querySelectorAll('.editable-input').forEach(input => input.disabled = true);
                    } else {    
                        const errorMappings = {
                            messageNoCamion: { selector: '#placa' },
                            messageCantidad: { selector: '#cantidad' },
                            messageNoCliente: { selector: '#documento' },
                            messageNoConductor: { selector: '#cedula' },
                            messageNoMaterial: { selector: '#material_nombre' },
                            messageCamionNoDisponible: { selector: '#fecha_fin_programada' },
                            messageConductorNoDisponible: { selector: '#fecha_fin_programada' },
                            messageInvalidStartDate: { selector: '#fecha_inicio_programada' },
                            messageInvalidEndDate: { selector: '#fecha_fin_programada' },
                        };
                        
                        // Primero limpia tooltips anteriores
                        document.querySelectorAll('.error-tooltip').forEach(el => el.remove());
                        // Quita clases de error previas
                        document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

                        // Agrupa errores por selector
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

                        // Crea un tooltip por campo con todos sus errores
                        Object.entries(errorsByField).forEach(([selector, errorMessages]) => {
                        const inputElement = document.querySelector(selector);
                        if (inputElement) {
                            // Marca el campo con error
                            inputElement.classList.add('has-error');
                            
                            // Crea el contenedor del tooltip
                            const tooltipContainer = document.createElement('div');
                            tooltipContainer.className = 'error-tooltip';
                            
                            // Ícono de error
                            const tooltipIcon = document.createElement('span');
                            tooltipIcon.id = 'error-tooltip-icon';
                            tooltipIcon.textContent = '!';
                            
                            // Contenido del tooltip con lista de errores
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
                            
                            // Inserta el tooltip después del campo
                            inputElement.parentNode.insertBefore(tooltipContainer, inputElement.nextSibling);
                        }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al guardar los cambios');
                });
        } else {
            // Habilitar edición
            if (cargueEstado === 'en progreso') {
                alert('No se pueden modificar los datos mientras el cargue está en progreso');
                return;
            }
    
            document.querySelectorAll('.editable-input').forEach(input => input.disabled = false);
            isEditing = true;
            const editButton = document.querySelector('.btn-edit-save');
            editButton.innerHTML = '<i class="fas fa-save"></i> Guardar';
            editButton.classList.remove('btn-edit');
            editButton.classList.add('btn-save');
            document.querySelector('.btn-danger').innerHTML = '<i class="fas fa-times"></i> Cancelar';
        }
    }

    // Extract cargue ID from the URL
    const pathParts = window.location.pathname.split('/');
    cargueId = pathParts[pathParts.length - 1];

    // Get the current estado from the select element
    cargueEstado = document.getElementById('estado').value;

    // Attach event listeners
    const editSaveButton = document.querySelector('.btn-edit-save');
    const deleteButton = document.querySelector('.btn-danger');
    const backButton = document.querySelector('.btn-back');

    if (editSaveButton) {
        editSaveButton.addEventListener('click', toggleEditMode);
        // Actualizar el botón de editar
        editSaveButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
        editSaveButton.classList.remove('btn-save');
        editSaveButton.classList.add('btn-edit');
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', confirmDelete);
    }

    if (backButton) {
        backButton.addEventListener('click', goBack);
    }

    // Establecer el mínimo para las fechas
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_inicio_programada').min = fechaHoy;
    document.getElementById('fecha_fin_programada').min = fechaHoy;
})