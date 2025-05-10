const db = require("../config/database");

class Reporte {
    static async obtenerCargues(filtros) {
        const {
            fechaDesde,
            fechaHasta,
            ordenado,
            cliente,
            camion,
            conductor,
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

        // Filtros de fecha - ahora usando fecha_inicio_programada
        if (fechaDesde) {
            query += ` AND fecha_inicio_programada::timestamp >= $${params.length + 1}::timestamp`;
            params.push(fechaDesde);
        }

        if (fechaHasta) {
            query += ` AND fecha_inicio_programada::timestamp <= $${params.length + 1}::timestamp`;
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
                query += ` ORDER BY fecha_inicio_programada`;
        }

        console.log('Consulta SQL ejecutada:', query);
        console.log('Parámetros:', params);

        try {
            const { rows } = await db.query(query, params);
            console.log(`Cargues encontrados: ${rows.length}`);
            return rows;
        } catch (error) {
            console.error('Error al obtener cargues:', error);
            throw error;
        }
    }
}

module.exports = Reporte;