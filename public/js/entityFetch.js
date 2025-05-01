async function fetchClienteByDocumento(documento) {
    try {
        const response = await fetch(`/admin/api/clientes/buscar?documento=${documento}`);
        if (!response.ok) {
            throw new Error('Cliente no encontrado');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching cliente:', error);
        return null;
    }
}

async function fetchCamionByPlaca(placa) {
    try {
        const response = await fetch(`/admin/api/camiones/buscar?placa=${placa}`);
        if (!response.ok) {
            throw new Error('Camión no encontrado');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching camión:', error);
        return null;
    }
}