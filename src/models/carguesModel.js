const db = require('../config/database');

const CarguesModel = {
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
                c.placa,
                cam.tipo_camion as tipo_camion,
                m.nombre as material,
                con.nombre as conductor,
                cli.nombre as cliente,
                TO_CHAR(c.fecha_inicio_real, 'YYYY-MM-DD HH24:MI') as fecha_inicio_real,
                TO_CHAR(c.fecha_inicio_programada, 'YYYY-MM-DD HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'YYYY-MM-DD HH24:MI') as fecha_fin_programada
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN conductores con ON c.cedula = con.cedula
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.estado = 'en progreso'
            AND DATE(c.fecha_inicio_programada) = $1
            ORDER BY c.fecha_inicio_programada DESC`,
            [hoy]
        );
        return result.rows;
    },

    getCarguesPendientesHoy: async () => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const result = await db.query(
            `SELECT 
                c.placa,
                cam.tipo_camion as tipo_camion,
                m.nombre as material,
                con.nombre as conductor,
                cli.nombre as cliente,
                TO_CHAR(c.fecha_inicio_real, 'YYYY-MM-DD HH24:MI') as fecha_inicio_real,
                TO_CHAR(c.fecha_inicio_programada, 'YYYY-MM-DD HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'YYYY-MM-DD HH24:MI') as fecha_fin_programada
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN conductores con ON c.cedula = con.cedula
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.estado = 'pendiente'
            AND DATE(c.fecha_inicio_programada) = $1
            ORDER BY c.fecha_inicio_programada DESC`,
            [hoy]
        );
        return result.rows;
    }
};

module.exports = CarguesModel;