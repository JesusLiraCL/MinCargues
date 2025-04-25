document.addEventListener('DOMContentLoaded', function() {
    function goBack() {
        // Obtener el referrer de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('referrer') || 'inicio';
        
        // Redirigir a la página correspondiente
        window.location.href = `/admin/${referrer}`;
    }

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
            // Validations before saving
            const requiredFields = [
                { id: 'fecha_inicio_programada', label: 'Inicio Programado' },
                { id: 'fecha_fin_programada', label: 'Fin Programado' },
                { id: 'material_nombre', label: 'Material' },
                { id: 'cantidad', label: 'Cantidad' },
                { id: 'estado', label: 'Estado' },
                { id: 'documento', label: 'Documento' },
                { id: 'cedula', label: 'Cédula' },
                { id: 'placa', label: 'Placa' }
            ];

            // Clear previous error messages
            document.querySelectorAll('.error-message').forEach(el => el.remove());

            let isValid = true;

            // Validate required fields
            requiredFields.forEach(field => {
                const input = document.getElementById(field.id);
                const parentRow = input.closest('.info-row');
                
                // Remove any existing error messages
                const existingError = parentRow.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }

                if (!input.value.trim()) {
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'error-message';
                    errorMessage.textContent = `El campo ${field.label} no puede estar vacío`;
                    
                    // Insert error message after the parent row
                    parentRow.insertAdjacentElement('afterend', errorMessage);
                    isValid = false;
                }
            });

            // Date validations
            const today = new Date();
            const startDateInput = document.getElementById('fecha_inicio_programada');
            const endDateInput = document.getElementById('fecha_fin_programada');
            
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);

            // Remove any existing date error messages
            const startDateParentRow = startDateInput.closest('.info-row');
            const endDateParentRow = endDateInput.closest('.info-row');
            
            const existingStartError = startDateParentRow.querySelector('.error-message');
            const existingEndError = endDateParentRow.querySelector('.error-message');
            
            if (existingStartError) existingStartError.remove();
            if (existingEndError) existingEndError.remove();

            if (startDate <= today) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'La fecha de inicio debe ser mayor a la fecha actual';
                
                // Insert error message after the parent row
                startDateParentRow.insertAdjacentElement('afterend', errorMessage);
                isValid = false;
            }

            if (endDate <= startDate) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'La fecha de fin debe ser mayor a la fecha de inicio';
                
                // Insert error message after the parent row
                endDateParentRow.insertAdjacentElement('afterend', errorMessage);
                isValid = false;
            }

            // Stop if validation fails
            if (!isValid) {
                return;
            }

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

            fetch(`/admin/cargue/${cargueId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    // Clear any previous server-side error messages
                    document.querySelectorAll('.error-message').forEach(el => el.remove());

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
                        console.log(data.errors);

                        const errorMappings = {
                            messageNoCamion: { selector: '#placa' },
                            messageCantidad: { selector: '#cantidad' },
                            messageNoCliente: { selector: '#documento' },
                            messageNoConductor: { selector: '#cedula' },
                            messageCamionNoDisponible: { selector: '#fecha_fin_programada' },
                            messageConductorNoDisponible: { selector: '#fecha_fin_programada' }
                        };
                        
                        Object.entries(errorMappings).forEach(([errorKey, { selector }]) => {
                            if (data.errors[errorKey]) {
                                const errorContainer = document.createElement('div');
                                errorContainer.className = 'error-message server-error';
                                errorContainer.textContent = data.errors[errorKey];
                                document.querySelector(selector).closest('.info-row').insertAdjacentElement('afterend', errorContainer);
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al guardar los cambios 2');
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