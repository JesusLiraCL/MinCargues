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
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_inicio_real, 'DD-MM-YYYY HH24:MI') as fecha_inicio_real
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
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'DD-MM-YYYY HH24:MI') as fecha_fin_programada
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
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') AS fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'DD-MM-YYYY HH24:MI') AS fecha_fin_programada,
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

    getCargueDetails: async (id) => {
        try {
            const result = await db.query(
                `SELECT 
                    c.id,
                    TO_CHAR(c.fecha_inicio_programada, 'YYYY-MM-DD HH24:MI') AS fecha_inicio_programada,
                    TO_CHAR(c.fecha_fin_programada, 'YYYY-MM-DD HH24:MI') AS fecha_fin_programada,
                    TO_CHAR(c.fecha_inicio_real, 'YYYY-MM-DD HH24:MI') AS fecha_inicio_real,
                    TO_CHAR(c.fecha_fin_real, 'YYYY-MM-DD HH24:MI') AS fecha_fin_real,
                    m.nombre AS material_nombre,
                    m.unidad_medida AS material_unidad,
                    c.estado,
                    c.observaciones,
                    c.cantidad,
                    cli.documento,
                    cli.nombre AS cliente_nombre,
                    cli.direccion,
                    cli.contacto,
                    cli.correo AS cliente_correo,
                    con.cedula,
                    con.nombre AS conductor_nombre,
                    con.edad,
                    con.telefono AS conductor_telefono,
                    con.correo AS conductor_correo,
                    cam.placa,
                    cam.capacidad,
                    cam.tipo_camion,
                    cam.habilitado
                FROM cargues c
                INNER JOIN camiones cam ON c.placa = cam.placa
                INNER JOIN conductores con ON c.cedula = con.cedula
                INNER JOIN materiales m ON c.codigo_material = m.codigo
                INNER JOIN clientes cli ON c.documento = cli.documento
                WHERE c.id = $1::int`,
                [id]
            );
    
            if (result.rows.length === 0) {
                throw new Error('Cargue no encontrado');
            }
            
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },
    
    deleteCargue: async (id) => {
        try {
            const result = await db.query(
                'DELETE FROM cargues WHERE id = $1',
                [id]
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    updateCargue: async (id, data) => {
        try {
            const { 
                fecha_inicio_programada, 
                fecha_fin_programada, 
                codigo_material, 
                cantidad, 
                estado, 
                observaciones, 
                documento, 
                cedula, 
                placa 
            } = data;
            
            const result = await db.query(
                `UPDATE cargues 
                SET 
                    fecha_inicio_programada = $1,
                    fecha_fin_programada = $2,
                    codigo_material = $3,
                    cantidad = $4,
                    estado = $5,
                    observaciones = $6,
                    documento = $7,
                    cedula = $8,
                    placa = $9
                WHERE id = $10
                RETURNING id`,
                [
                    fecha_inicio_programada,
                    fecha_fin_programada,
                    codigo_material,
                    cantidad,
                    estado,
                    observaciones,
                    documento,
                    cedula,
                    placa,
                    id
                ]
            );

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al actualizar cargue:', error);
            return false;
        }
    },

    getCarguesByConductor: async ({ cedula, inicioWithBuffer, finWithBuffer, currentId }) => {
        const result = await db.query(
            `SELECT * FROM cargues 
            WHERE 
                (cedula = $1) AND 
                (id != $8) AND 
                (
                    (fecha_inicio_programada BETWEEN $2 AND $3) OR 
                    (fecha_fin_programada BETWEEN $4 AND $5) OR 
                    (fecha_inicio_programada <= $6 AND fecha_fin_programada >= $7)
                )`,
            [
                cedula,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                currentId
            ]
        );
        return result.rows;
    },

    getCarguesByCamion: async ({ placa, inicioWithBuffer, finWithBuffer, currentId }) => {
        const result = await db.query(
            `SELECT * FROM cargues 
            WHERE 
                (placa = $1) AND 
                (id != $8) AND 
                (
                    (fecha_inicio_programada BETWEEN $2 AND $3) OR 
                    (fecha_fin_programada BETWEEN $4 AND $5) OR 
                    (fecha_inicio_programada <= $6 AND fecha_fin_programada >= $7)
                )`,
            [
                placa,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                currentId
            ]
        );
        return result.rows;
    },
};

module.exports = cargueModel;