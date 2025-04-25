// Doble click ir a cargue
document.addEventListener('DOMContentLoaded', function () {
    const tables = document.querySelectorAll('.simple-table');
    tables.forEach(table => {
        const tbody = table.querySelector('tbody');
        
        if (!tbody) {
            console.error('No se encontró el tbody en la tabla:', table);
            return;
        }

        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('dblclick', function(e) {
                const id = this.cells[0].textContent;
                if (id) {
                    // Redirigir a la página de detalles
                    window.location.href = `/admin/cargue/${id}?referrer=inicio`;
                } else {
                    console.error('No se pudo obtener el ID del cargue');
                }
            });
        });
    });
});
