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
    let currentNombreMaterial = '';
    let originalData = {};

    // Función para mostrar/ocultar elementos
    function setElementDisplay(element, display) {
        if (element) element.style.display = display;
    }

    // Función para actualizar la interfaz según el modo
    function updateUI() {
        if (isEditMode) {
            modalTitle.textContent = 'Datos de Material';
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
            modalTitle.textContent = 'Agregar Material';
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

    // Función para abrir modal en modo agregar
    function openAddMode() {
        isEditMode = false;
        form.reset();
        toggleInputs(false);
        updateUI();
        modal.style.display = "block";
    }
    
    // Función para abrir modal en modo editar
    window.openMaterialModalWithData = function(materialData) {
        isEditMode = true;
        currentNombreMaterial = materialData.nombre;
        originalData = {...materialData};
        
        document.getElementById('nombre').value = materialData.nombre || '';
        document.getElementById('unidad_medida').value = materialData.unidad_medida || '';
        
        toggleInputs(true);
        updateUI();
        modal.style.display = "block";
    }

    // Función para alternar entre editar/guardar
    function toggleEditSave() {
        if (btnEditSave.classList.contains('btn-edit')) {
            toggleInputs(false);
            btnEditSave.innerHTML = '<i class="fas fa-save"></i> Guardar';
            btnEditSave.classList.remove('btn-edit');
            btnEditSave.classList.add('btn-save');
            btnDelete.innerHTML = '<i class="fas fa-times"></i> Cancelar';
            btnDelete.classList.remove('btn-danger');
            btnDelete.classList.add('btn-secondary');
        } else {
            saveMaterial();
        }
    }

    function clearPreviousErrors() {
        document.querySelectorAll('.error-tooltip').forEach(el => el.remove());
        document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    }
    
    function showErrorTooltip(selector, message) {
        const inputElement = document.querySelector(selector);
        if (!inputElement) return;
    
        document.querySelectorAll('.error-tooltip').forEach(el => el.remove());
        inputElement.classList.remove('has-error');
    
        let labelElement;
        const inputId = inputElement.getAttribute('id');
        
        if (inputId) {
            labelElement = document.querySelector(`label[for="${inputId}"]`);
        }
        
        if (!labelElement) {
            labelElement = inputElement.closest('label');
        }
        
        const referenceElement = labelElement || inputElement.parentNode;
    
        inputElement.classList.add('has-error');
    
        const tooltipContainer = document.createElement('div');
        tooltipContainer.className = 'error-tooltip';
    
        const tooltipIcon = document.createElement('span');
        tooltipIcon.id = 'error-tooltip-icon';
        tooltipIcon.textContent = '!';
    
        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'error-tooltip-content';
        
        const errorList = document.createElement('ul');
        errorList.className = 'error-list';
        
        const errorItem = document.createElement('li');
        errorItem.textContent = message;
        errorList.appendChild(errorItem);
        
        tooltipContent.appendChild(errorList);
        tooltipContainer.appendChild(tooltipIcon);
        tooltipContainer.appendChild(tooltipContent);
    
        referenceElement.parentNode.insertBefore(tooltipContainer, referenceElement.nextSibling);

        tooltipIcon.addEventListener('mouseenter', () => {
            tooltipContent.style.visibility = 'visible';
        });
        
        tooltipIcon.addEventListener('mouseleave', () => {
            tooltipContent.style.visibility = 'hidden';
        });
    }
    
    // Función para guardar material
    function saveMaterial() {
        const material = {
            nombre: document.getElementById('nombre').value,
            unidad_medida: document.getElementById('unidad_medida').value
        };
        
        fetch(`/admin/api/materiales/${currentNombreMaterial}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(material)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                toggleInputs(true);
                btnEditSave.innerHTML = '<i class="fas fa-edit"></i> Editar';
                btnEditSave.classList.remove('btn-save');
                btnEditSave.classList.add('btn-edit');
                btnDelete.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
                btnDelete.classList.remove('btn-secondary');
                btnDelete.classList.add('btn-danger');
                
                originalData = {...material};
                
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            } else {
                clearPreviousErrors();
                if (data.field) {
                    showErrorTooltip(`#${data.field}`, data.message);
                } else {
                    showErrorTooltip('#nombre', data.message);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar los cambios');
        });
    }
    
    // Función para cancelar edición
    function cancelEdit() {
        clearPreviousErrors();
        if (btnEditSave.classList.contains('btn-save')) {
            document.getElementById('nombre').value = originalData.nombre;
            document.getElementById('unidad_medida').value = originalData.unidad_medida;
            
            toggleInputs(true);
            btnEditSave.innerHTML = '<i class="fas fa-edit"></i> Editar';
            btnEditSave.classList.remove('btn-save');
            btnEditSave.classList.add('btn-edit');
            btnDelete.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
            btnDelete.classList.remove('btn-secondary');
            btnDelete.classList.add('btn-danger');
        } else {
            if (confirm('¿Estás seguro de eliminar este material?')) {
                deleteMaterial();
            }
        }
    }
    
    // Función para eliminar material
    function deleteMaterial() {
        fetch(`/admin/api/materiales/${currentNombreMaterial}/delete`, {
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
        clearPreviousErrors();
        
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
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!isEditMode) {
                const material = {
                    nombre: document.getElementById('nombre').value,
                    unidad_medida: document.getElementById('unidad_medida').value
                };
                
                fetch('/admin/api/materiales/agregar-material', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(material)
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
                        clearPreviousErrors();
                        if (data.field) {
                            showErrorTooltip(`#${data.field}`, data.message);
                        } else {
                            showErrorTooltip('#nombre', data.message);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al agregar material');
                });
            }
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});