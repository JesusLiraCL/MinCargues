document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("addClientModal");
    const btn = document.getElementById("add-button");
    const span = document.getElementsByClassName("close")[0];
    const form = document.getElementById("addClientForm");
    const cancelButton = document.querySelector('.btn-cancel');
    
    if (btn) {
        btn.onclick = function() {
            modal.style.display = "block";
        }
    }
    
    span.onclick = function() {
        modal.style.display = "none";
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    
    cancelButton.onclick = function() {
        // Clear all input fields
        form.reset();
        
        // Close the modal
        modal.style.display = "none";
    }
    
    // Manejo del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const cliente = {
            documento: document.getElementById('documento').value,
            nombre: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            contacto: document.getElementById('contacto').value,
            correo: document.getElementById('correo').value
        };
        
        // Aquí puedes hacer una llamada AJAX para guardar el cliente
        fetch('/admin/api/clientes/agregar-cliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cliente)
        })
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
            document.querySelectorAll('.error-tooltip').forEach(el => el.remove());
            if (data.success) {
                // Cerrar modal, resetear formulario y redirigir
                modal.style.display = "none";
                form.reset();
                // Redirigir a la URL proporcionada por el servidor
                window.location.href = data.redirect;
            } else {
                const label = document.querySelector('label[for="documento"]');
                const input = document.getElementById('documento');
                if (label && input) {
                    input.classList.add('has-error');
                    // Limpia tooltips previos del label
                    label.querySelectorAll('.error-tooltip').forEach(el => el.remove());
                    
                    // Tooltip al lado del label
                    const tooltipContainer = document.createElement('span');
                    tooltipContainer.className = 'error-tooltip';

                    const tooltipIcon = document.createElement('span');
                    tooltipIcon.id = 'error-tooltip-icon';
                    tooltipIcon.textContent = '!';

                    const tooltipContent = document.createElement('div');
                    tooltipContent.className = 'error-tooltip-content';
                    tooltipContent.textContent = data.message;

                    tooltipContainer.appendChild(tooltipIcon);
                    tooltipContainer.appendChild(tooltipContent);
                    label.appendChild(tooltipContainer);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar el cliente');
        });
    });
});