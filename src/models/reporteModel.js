const db = require("../config/database");

class Reporte {
    static async obtenerCargues(filtros) {
        const {
            fechaDesde,
            fechaHasta,
            ordenado,
            cliente, // Ahora sería el documento del cliente
            camion,  // Sería la placa del camión
            conductor, // Sería la cédula del conductor
            incluir_cargues
        } = filtros;

        let query = `
            SELECT 
                id, 
                placa,
                documento,
                codigo_material,
                cantidad,
                fecha_inicio_programada,
                fecha_fin_programada,
                fecha_inicio_real,
                fecha_fin_real,
                estado,
                observaciones,
                usuario_id,
                conductor_id
            FROM cargues
            WHERE 1=1
        `;

        const params = [];

        // Filtros de fecha - ahora usando fecha_inicio_real como referencia
        if (fechaDesde) {
            query += ` AND fecha_inicio_real >= $${params.length + 1}`;
            params.push(fechaDesde);
        }

        if (fechaHasta) {
            query += ` AND fecha_inicio_real <= $${params.length + 1}`;
            params.push(fechaHasta);
        }

        // Filtros opcionales
        if (cliente) {
            query += ` AND documento = $${params.length + 1}`;
            params.push(cliente);
        }

        if (camion) {
            query += ` AND placa = $${params.length + 1}`;
            params.push(camion);
        }

        if (conductor) {
            query += ` AND conductor_id = $${params.length + 1}`;
            params.push(conductor);
        }

        // Incluir o no cargues programados y cancelados
        if (!incluir_cargues) {
            query += ` AND estado = 'completado'`;
        }

        // Ordenamiento
        switch (ordenado) {
            case 'id':
                query += ` ORDER BY id`;
                break;
            case 'camion':
                query += ` ORDER BY placa`;
                break;
            case 'cliente':
                query += ` ORDER BY documento`;
                break;
            default: // 'fecha'
                query += ` ORDER BY fecha_inicio_real`;
        }

        try {
            const { rows } = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error al obtener cargues:', error);
            throw error;
        }
    }
}

module.exports = Reporte;