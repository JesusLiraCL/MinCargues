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
                u.nombre as conductor,
                m.nombre as material,
                c.cantidad,
                m.unidad_medida as unidad,
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_inicio_real, 'DD-MM-YYYY HH24:MI') as fecha_inicio_real
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN usuarios u ON c.conductor_id = u.id
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
                u.nombre as conductor,
                m.nombre as material,
                c.cantidad,
                m.unidad_medida as unidad,
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') as fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'DD-MM-YYYY HH24:MI') as fecha_fin_programada
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN usuarios u ON c.conductor_id = u.id
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

    getCarguesDesdeEsteMes: async () => {
        const ahora = new Date();
        const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toLocaleDateString('en-CA');
        const result = await db.query(
            `SELECT 
                c.id,
                c.placa,
                cam.tipo_camion AS tipo_camion,
                m.nombre AS material,
                m.unidad_medida AS unidad,
                c.cantidad,
                u.nombre AS conductor,
                cli.nombre AS cliente,
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') AS fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'DD-MM-YYYY HH24:MI') AS fecha_fin_programada,
                c.estado
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN usuarios u ON c.conductor_id = u.id
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.fecha_inicio_programada >= $1::date
            ORDER BY c.fecha_inicio_programada ASC`,
            [primerDiaDelMes]
        );
        return result.rows;
    },

    getCarguesHastaAyer: async () => {
        const ahora = new Date();
        const ayer = new Date(ahora);
        ayer.setDate(ahora.getDate() - 1);
        const ayerStr = ayer.toLocaleDateString('en-CA');
        
        const result = await db.query(
            `SELECT 
                c.id,
                c.placa,
                cam.tipo_camion AS tipo_camion,
                m.nombre AS material,
                m.unidad_medida AS unidad,
                c.cantidad,
                u.nombre AS conductor,
                cli.nombre AS cliente,
                TO_CHAR(c.fecha_inicio_programada, 'DD-MM-YYYY HH24:MI') AS fecha_inicio_programada,
                TO_CHAR(c.fecha_fin_programada, 'DD-MM-YYYY HH24:MI') AS fecha_fin_programada,
                c.estado
            FROM cargues c
            INNER JOIN camiones cam ON c.placa = cam.placa
            INNER JOIN usuarios u ON c.conductor_id = u.id
            INNER JOIN materiales m ON c.codigo_material = m.codigo
            INNER JOIN clientes cli ON c.documento = cli.documento
            WHERE c.fecha_inicio_programada <= ($1::date + INTERVAL '1 day')
            ORDER BY c.fecha_inicio_programada DESC`,
            [ayerStr]
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
                    u.id as conductor_id,
                    u.nombre AS conductor_nombre,
                    u.edad,
                    u.telefono AS conductor_telefono,
                    u.correo AS conductor_correo,
                    cam.placa,
                    cam.capacidad,
                    cam.tipo_camion,
                    cam.habilitado
                FROM cargues c
                INNER JOIN camiones cam ON c.placa = cam.placa
                INNER JOIN usuarios u ON c.conductor_id = u.id
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

    getStartDate: async (id) => {
        const result = await db.query(
            `SELECT fecha_inicio_programada 
            FROM cargues 
            WHERE id = $1`,
            [id]
        );

        return result.rows[0];
    },

    updateCargue: async (id, data) => {
        console.log("Empezando update");
        try {
            const {
                fecha_inicio_programada,
                fecha_fin_programada,
                codigo_material,
                cantidad,
                estado,
                observaciones,
                documento,
                conductor_id,
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
                    conductor_id = $8,
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
                    conductor_id,
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

    getCarguesByConductor: async ({ conductor_id, inicioWithBuffer, finWithBuffer, currentId }) => {
        const result = await db.query(
            `SELECT * FROM cargues 
            WHERE 
                (conductor_id = $1) AND 
                (${currentId ? 'id != $8' : 'true'}) AND 
                (
                    (fecha_inicio_programada BETWEEN $2 AND $3) OR 
                    (fecha_fin_programada BETWEEN $4 AND $5) OR 
                    (fecha_inicio_programada <= $6 AND fecha_fin_programada >= $7)
                ) AND
                (estado = 'pendiente' OR estado = 'en progreso')`,
            [
                conductor_id,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                ...(currentId ? [currentId] : [])
            ]
        );
        return result.rows;
    },

    getCarguesByCamion: async ({ placa, inicioWithBuffer, finWithBuffer, currentId }) => {
        const result = await db.query(
            `SELECT * FROM cargues 
            WHERE 
                (placa = $1) AND 
                (${currentId ? 'id != $8' : 'true'}) AND 
                (
                    (fecha_inicio_programada BETWEEN $2 AND $3) OR 
                    (fecha_fin_programada BETWEEN $4 AND $5) OR 
                    (fecha_inicio_programada <= $6 AND fecha_fin_programada >= $7)
                ) AND
                (estado = 'pendiente' OR estado = 'en progreso')`,
            [
                placa,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                inicioWithBuffer, finWithBuffer,
                ...(currentId ? [currentId] : [])
            ]
        );
        return result.rows;
    },

    addCargue: async (data) => {
        const {
            fecha_inicio_programada,
            fecha_fin_programada,
            codigo_material,
            cantidad,
            observaciones,
            documento,
            conductor_id,
            placa,
            user_id
        } = data;

        const result = await db.query(
            `INSERT INTO cargues (
                fecha_inicio_programada, 
                fecha_fin_programada, 
                codigo_material, 
                cantidad, 
                observaciones, 
                documento, 
                conductor_id, 
                placa, 
                estado,
                usuario_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id`,
            [
                fecha_inicio_programada,
                fecha_fin_programada,
                codigo_material,
                cantidad,
                observaciones,
                documento,
                conductor_id,
                placa,
                'pendiente',
                user_id,
            ]
        );
        return result.rows[0];
    },
};

module.exports = cargueModel;