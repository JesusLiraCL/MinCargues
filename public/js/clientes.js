document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("addClientModal");
    const btn = document.getElementById("add-button");
    const span = document.getElementsByClassName("close")[0];
    const form = document.getElementById("addClientForm");
    const cancelButton = document.querySelector('.btn-cancel');
    let isEditMode = false;
    let currentDocumento = '';
    
    // Función para abrir modal en modo agregar
    function openAddMode() {
        isEditMode = false;
        form.reset();
        document.querySelector('.modal-title').textContent = 'Agregar Cliente';
        modal.style.display = "block";
    }
    
    // Función para abrir modal en modo editar
    window.openClientModalWithData = function(clienteData) {
        isEditMode = true;
        currentDocumento = clienteData.documento;
        
        document.getElementById('documento').value = clienteData.documento || '';
        document.getElementById('nombre').value = clienteData.nombre || '';
        document.getElementById('direccion').value = clienteData.direccion || '';
        document.getElementById('contacto').value = clienteData.contacto || '';
        document.getElementById('correo').value = clienteData.correo || '';
        
        document.querySelector('.modal-title').textContent = 'Editar Cliente';
        modal.style.display = "block";
    }
    
    // Eventos de apertura/cierre
    if (btn) btn.onclick = openAddMode;
    span.onclick = closeModal;
    cancelButton.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target == modal) closeModal();
    }
    
    function closeModal() {
        modal.style.display = "none";
        form.reset();
    }
    
    // Manejador único del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const cliente = {
            documento: document.getElementById('documento').value,
            nombre: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            contacto: document.getElementById('contacto').value,
            correo: document.getElementById('correo').value
        };
        
        let url, method;
        
        if (isEditMode) {
            url = `/admin/api/clientes/${currentDocumento}/update`;
            method = 'POST';
        } else {
            url = '/admin/api/clientes/agregar-cliente';
            method = 'POST';
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cliente)
        })
        .then(response => {
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            return response.json();
        })
        .then(data => {
            clearErrors();
            
            if (data.success) {
                modal.style.display = "none";
                form.reset();
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    window.location.reload();
                }
            } else {
                showError(data.field || 'documento', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    });
    
    // Funciones auxiliares
    function clearErrors() {
        document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
        document.querySelectorAll('.error-tooltip').forEach(el => el.remove());
    }
    
    function showError(fieldId, message) {
        const fieldElement = document.getElementById(fieldId);
        const label = document.querySelector(`label[for="${fieldId}"]`);
        
        if (fieldElement && label) {
            fieldElement.classList.add('has-error');
            
            const tooltipContainer = document.createElement('span');
            tooltipContainer.className = 'error-tooltip';
            tooltipContainer.innerHTML = `
                <span id="error-tooltip-icon">!</span>
                <div class="error-tooltip-content">${message}</div>
            `;
            label.appendChild(tooltipContainer);
        } else {
            alert(message);
        }
    }
});