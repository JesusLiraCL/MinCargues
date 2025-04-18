const db = require('../config/database');

const cargueModel = {
    getCarguesCompletadosHoy: async () => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const result = await db.query(
            `SELECT COUNT(*) as total 
            FROM cargues 
            WHERE estado = 'completado' 
            AND DATE_TRUNC('day', fecha_inicio_programada) = $1`,
            [hoy]
        );
        return parseInt(result.rows[0]?.total) || 0;
    },

    getCarguesAsignadosHoy: async () => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const result = await db.query(
            `SELECT COUNT(*) as total 
            FROM cargues 
            WHERE DATE(fecha_inicio_programada) = $1`,
            [hoy]
        );
        return parseInt(result.rows[0]?.total) || 0;
    },

    getCarguesEnCurso: async () => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const result = await db.query(
            `SELECT 
                c.id,
                c.placa,
                con.nombre as conductor,
                m.nombre as material,
                c.cantidad,
                m.unidad_medida as unidad,
                TO_CHAR(c.fecha_inicio_programada, 'YYYY-MM-DD HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_inicio_real, 'YYYY-MM-DD HH24:MI') as fecha_inicio_real
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN conductores con ON c.cedula = con.cedula
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.estado = 'en progreso'
            AND c.fecha_inicio_programada >= $1::date
            AND c.fecha_inicio_programada < ($1::date + INTERVAL '1 day')
            ORDER BY c.fecha_inicio_programada DESC`,
            [hoy]
        );
        return result.rows;
    },

    getCarguesPendientesHoy: async () => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const result = await db.query(
            `SELECT 
                c.id,
                c.placa,
                con.nombre as conductor,
                m.nombre as material,
                c.cantidad,
                m.unidad_medida as unidad,
                TO_CHAR(c.fecha_inicio_programada, 'YYYY-MM-DD HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_inicio_real, 'YYYY-MM-DD HH24:MI') as fecha_inicio_real
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN conductores con ON c.cedula = con.cedula
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.estado = 'pendiente'
            AND c.fecha_inicio_programada >= $1::date
            AND c.fecha_inicio_programada < ($1::date + INTERVAL '1 day')
            ORDER BY c.fecha_inicio_programada DESC`,
            [hoy]
        );
        return result.rows;
    },

    getCarguesDesdeHoy: async () => {
        const hoy = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
        const result = await db.query(
            `SELECT 
                c.id,
                c.placa,
                cam.tipo_camion AS tipo_camion,
                m.nombre AS material,
                m.unidad_medida AS unidad,
                c.cantidad,
                con.nombre AS conductor,
                cli.nombre AS cliente,
                TO_CHAR(c.fecha_inicio_programada, 'YYYY-MM-DD HH24:MI') AS fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'YYYY-MM-DD HH24:MI') AS fecha_fin_programada,
                c.estado
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN conductores con ON c.cedula = con.cedula
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.fecha_inicio_programada >= $1::date
            ORDER BY c.fecha_inicio_programada ASC`,
            [hoy]
        );
        return result.rows;
    },
};

module.exports = cargueModel;