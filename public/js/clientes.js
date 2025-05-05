document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("addClientModal");
    const btn = document.getElementById("add-button");
    const span = document.getElementsByClassName("close")[0];
    const form = document.getElementById("addClientForm");
    
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
            if (data.success) {
                // Cerrar modal y recargar datos
                modal.style.display = "none";
                form.reset();
                // Aquí puedes actualizar la tabla o recargar la página
                window.location.reload();
            } else {
                alert('Error al guardar el cliente: ' + (data.message || ''));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar el cliente');
        });
    });
});