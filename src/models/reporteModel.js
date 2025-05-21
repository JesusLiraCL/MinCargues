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
                c.id, 
                c.placa,
                c.documento,
                cl.nombre as nombre_cliente,
                u.cedula as cedula_conductor,
                u.nombre as nombre_conductor,
                m.nombre as nombre_material,
                c.codigo_material,
                c.cantidad,
                c.fecha_inicio_programada,
                c.fecha_fin_programada,
                c.fecha_inicio_real,
                c.fecha_fin_real,
                c.estado,
                c.observaciones,
                c.usuario_id,
                c.conductor_id
            FROM cargues c
            LEFT JOIN clientes cl ON c.documento = cl.documento
            LEFT JOIN usuarios u ON c.conductor_id = u.id
            LEFT JOIN materiales m ON c.codigo_material = m.codigo
            WHERE 1=1
        `;

        const params = [];

        // Filtros de fecha
        if (fechaDesde) {
            query += ` AND c.fecha_inicio_programada::timestamp >= $${params.length + 1}::timestamp`;
            params.push(fechaDesde);
        }

        if (fechaHasta) {
            query += ` AND c.fecha_inicio_programada::timestamp <= $${params.length + 1}::timestamp`;
            params.push(fechaHasta);
        }

        // Filtros opcionales
        if (cliente) {
            query += ` AND c.documento = $${params.length + 1}`;
            params.push(cliente);
        }

        if (camion) {
            query += ` AND c.placa = $${params.length + 1}`;
            params.push(camion);
        }

        if (conductor) {
            query += ` AND u.cedula = $${params.length + 1}`;
            params.push(conductor);
        }

        // Incluir o no cargues programados y cancelados
        if (!incluir_cargues) {
            query += ` AND c.estado = 'completado'`;
        }

        // Ordenamiento
        switch (ordenado) {
            case 'id':
                query += ` ORDER BY c.id`;
                break;
            case 'camion':
                query += ` ORDER BY c.placa`;
                break;
            case 'cliente':
                query += ` ORDER BY cl.nombre`;
                break;
            case 'conductor':
                query += ` ORDER BY u.nombre`;
                break;
            default: // 'fecha'
                query += ` ORDER BY c.fecha_inicio_programada`;
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