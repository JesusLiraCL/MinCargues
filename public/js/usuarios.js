document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const modal = document.getElementById("modalWindow");
    const btnAdd = document.getElementById("add-button");
    const spanClose = document.getElementsByClassName("close")[0];
    const form = document.getElementById("modalForm");
    const btnCancel = document.querySelector('.btn-cancel');
    const btnDelete = document.getElementById("delete-button");
    const btnEditSave = document.getElementById("edit-save-button");
    const btnSubmit = document.getElementById("submit-button");
    const modalTitle = document.querySelector('.modal-title');
    const inputs = form ? Array.from(form.querySelectorAll('input, select')) : [];

    // Estados
    let isEditMode = false;
    let currentNombreUsuario = '';
    let originalData = {};

    // Función para mostrar/ocultar elementos
    function setElementDisplay(element, display) {
        if (element) element.style.display = display;
    }

    // Función para actualizar la interfaz según el modo
    function updateUI() {
        if (isEditMode) {
            // Modo edición
            modalTitle.textContent = 'Datos de Usuario';
            setElementDisplay(btnSubmit, 'none');
            setElementDisplay(btnEditSave, 'block');
            setElementDisplay(btnDelete, 'block');
            setElementDisplay(btnCancel, 'none');
            
            if (btnEditSave) {
                btnEditSave.innerHTML = btnEditSave.classList.contains('btn-save') 
                    ? '<i class="fas fa-save"></i> Guardar'
                    : '<i class="fas fa-edit"></i> Editar';
            }
            
            if (btnDelete) {
                btnDelete.innerHTML = btnDelete.classList.contains('btn-cancel')
                    ? '<i class="fas fa-times"></i> Cancelar'
                    : '<i class="fas fa-trash"></i> Eliminar';
            }
        } else {
            // Modo agregar
            modalTitle.textContent = 'Agregar Usuario';
            setElementDisplay(btnSubmit, 'block');
            setElementDisplay(btnEditSave, 'none');
            setElementDisplay(btnDelete, 'none');
            setElementDisplay(btnCancel, 'block');
        }
    }

    // Función para habilitar/deshabilitar inputs
    function toggleInputs(disabled) {
        inputs.forEach(input => {
            input.disabled = disabled;
        });
    }

    // Función para mostrar/ocultar campo de contraseña
    function togglePasswordField() {
        const passwordGroup = document.getElementById('password-group');
        const passwordInput = document.getElementById('contrasena');
        
        if (isEditMode) {
            // Ocultar campo de contraseña en modo edición
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (passwordInput) passwordInput.required = false;
        } else {
            // Mostrar campo de contraseña en modo agregar
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (passwordInput) passwordInput.required = true;
        }
    }

    // Función para abrir modal en modo agregar
    function openAddMode() {
        isEditMode = false;
        form.reset();
        toggleInputs(false);
        togglePasswordField();
        updateUI();
        modal.style.display = "block";
    }
    
    // Función para abrir modal en modo editar
    window.openUserModalWithData = function(userData) {
        isEditMode = true;
        currentNombreUsuario = userData.nombre_usuario;
        originalData = {...userData};
        
        // Llenar formulario
        document.getElementById('nombre_usuario').value = userData.nombre_usuario || '';
        document.getElementById('cedula').value = userData.cedula || '';
        document.getElementById('nombre').value = userData.nombre || '';
        document.getElementById('edad').value = userData.edad || '';
        document.getElementById('telefono').value = userData.telefono || '';
        document.getElementById('correo').value = userData.correo || '';
        document.getElementById('rol').value = userData.rol || '';
        
        toggleInputs(true);
        togglePasswordField();
        updateUI();
        modal.style.display = "block";
    }

    // Función para alternar entre editar/guardar
    function toggleEditSave() {
        if (btnEditSave.classList.contains('btn-edit')) {
            // Cambiar a modo edición
            toggleInputs(false);
            btnEditSave.innerHTML = '<i class="fas fa-save"></i> Guardar';
            btnEditSave.classList.remove('btn-edit');
            btnEditSave.classList.add('btn-save');
            btnDelete.innerHTML = '<i class="fas fa-times"></i> Cancelar';
            btnDelete.classList.remove('btn-danger');
            btnDelete.classList.add('btn-secondary');
        } else {
            // Guardar cambios
            saveUser();
        }
    }
    
    // Función para guardar usuario
    function saveUser() {
        const usuario = {
            nombre_usuario: document.getElementById('nombre_usuario').value,
            cedula: document.getElementById('cedula').value,
            nombre: document.getElementById('nombre').value,
            edad: document.getElementById('edad').value,
            telefono: document.getElementById('telefono').value,
            correo: document.getElementById('correo').value,
            rol: document.getElementById('rol').value
        };
        
        fetch(`/admin/api/usuarios/${currentNombreUsuario}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuario)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Volver a modo visualización
                toggleInputs(true);
                btnEditSave.innerHTML = '<i class="fas fa-edit"></i> Editar';
                btnEditSave.classList.remove('btn-save');
                btnEditSave.classList.add('btn-edit');
                btnDelete.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
                btnDelete.classList.remove('btn-secondary');
                btnDelete.classList.add('btn-danger');
                
                // Actualizar datos originales
                originalData = {...usuario};
                
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            } else {
                alert(data.message || 'Error al guardar');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar los cambios');
        });
    }
    
    // Función para cancelar edición
    function cancelEdit() {
        if (btnEditSave.classList.contains('btn-save')) {
            // Restaurar valores originales
            document.getElementById('nombre_usuario').value = originalData.nombre_usuario;
            document.getElementById('cedula').value = originalData.cedula;
            document.getElementById('nombre').value = originalData.nombre;
            document.getElementById('edad').value = originalData.edad;
            document.getElementById('telefono').value = originalData.telefono;
            document.getElementById('correo').value = originalData.correo;
            document.getElementById('rol').value = originalData.rol;
            
            // Volver a modo visualización
            toggleInputs(true);
            btnEditSave.innerHTML = '<i class="fas fa-edit"></i> Editar';
            btnEditSave.classList.remove('btn-save');
            btnEditSave.classList.add('btn-edit');
            btnDelete.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
            btnDelete.classList.remove('btn-secondary');
            btnDelete.classList.add('btn-danger');
        } else {
            // Eliminar usuario
            if (confirm('¿Estás seguro de eliminar este usuario?')) {
                deleteUser();
            }
        }
    }
    
    // Función para eliminar usuario
    function deleteUser() {
        fetch(`/admin/api/usuarios/${currentNombreUsuario}/delete`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                modal.style.display = "none";
                window.location.reload();
            } else {
                alert(data.message || 'Error al eliminar');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    }
    
    // Función para cerrar modal
    function closeModal() {
        modal.style.display = "none";
        form.reset();

        if (isEditMode) {
            toggleInputs(true);
            btnEditSave.innerHTML = '<i class="fas fa-edit"></i> Editar';
            btnEditSave.classList.remove('btn-save');
            btnEditSave.classList.add('btn-edit');
            btnDelete.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
            btnDelete.classList.remove('btn-secondary');
            btnDelete.classList.add('btn-danger');
        }
    }
    
    // Event listeners
    if (btnAdd) btnAdd.addEventListener('click', openAddMode);
    if (spanClose) spanClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnDelete) btnDelete.addEventListener('click', cancelEdit);
    if (btnEditSave) btnEditSave.addEventListener('click', toggleEditSave);
    
    // Listener para el botón de agregar (submit)
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!isEditMode) {
                const usuario = {
                    nombre_usuario: document.getElementById('nombre_usuario').value,
                    cedula: document.getElementById('cedula').value,
                    nombre: document.getElementById('nombre').value,
                    edad: document.getElementById('edad').value,
                    telefono: document.getElementById('telefono').value,
                    correo: document.getElementById('correo').value,
                    rol: document.getElementById('rol').value,
                    contrasena: document.getElementById('contrasena').value
                };
                
                fetch('/admin/api/usuarios/agregar-usuario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(usuario)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        closeModal();
                        if (data.redirect) {
                            window.location.href = data.redirect;
                        } else {
                            window.location.reload();
                        }
                    } else {
                        alert(data.message || 'Error al agregar usuario');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al agregar usuario');
                });
            }
        });
    }

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});