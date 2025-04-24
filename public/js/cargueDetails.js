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
            isEditing = false;
            const editButton = document.querySelector('.btn-edit-save');
            editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
            editButton.classList.remove('btn-save');
            editButton.classList.add('btn-edit');
            document.querySelector('.btn-danger').innerHTML = '<i class="fas fa-trash"></i> Eliminar';
            document.querySelectorAll('.editable-input').forEach(input => input.disabled = true);
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
        // Guardar cambios
        const data = {
            fecha_inicio_programada: document.getElementById('fecha_inicio_programada').value,
            fecha_fin_programada: document.getElementById('fecha_fin_programada').value,
            material_nombre: document.getElementById('material_nombre').value,
            cantidad: document.getElementById('cantidad').value,
            estado: document.getElementById('estado').value,
            observaciones: document.getElementById('observaciones').value,
            documento: document.getElementById('documento').value,
            cedula: document.getElementById('cedula').value,
            placa: document.getElementById('placa').value
        };

        // Validaciones
        if (data.fecha_inicio_programada && data.fecha_fin_programada) {
            const inicio = new Date(data.fecha_inicio_programada);
            const fin = new Date(data.fecha_fin_programada);

            if (fin < inicio) {
                alert('La fecha de finalización no puede ser menor a la fecha de inicio programada');
                return;
            }
        }

        fetch(`/admin/cargue/${cargueId}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
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
                    alert('Error al guardar los cambios 1');
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

// Actualizar el botón de editar
document.addEventListener('DOMContentLoaded', () => {
    // Extract cargue ID from the URL
    const pathParts = window.location.pathname.split('/');
    cargueId = pathParts[pathParts.length - 1];

    // Get the current estado from the select element
    cargueEstado = document.getElementById('estado').value;

    const editButton = document.querySelector('.btn-edit-save');
    editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editButton.classList.remove('btn-save');
    editButton.classList.add('btn-edit');

    // Establecer el mínimo para las fechas
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_inicio_programada').min = fechaHoy;
    document.getElementById('fecha_fin_programada').min = fechaHoy;
});