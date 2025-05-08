const db = require('../config/database');

const camionModel = {
    getTotalCamionesHabilitados: async () => {
        const result = await db.query(
            `SELECT COUNT(*) as total 
             FROM camiones 
             WHERE habilitado = true AND eliminado = false`
        );
        return parseInt(result.rows[0]?.total) || 0;
    },

    getCamionByPlaca: async (placa) => {
        const result = await db.query(
            `SELECT c.*, 
                    u.id as conductor_id, 
                    u.nombre as conductor_nombre,
                    u.cedula as conductor_cedula,
                    u.edad as conductor_edad,
                    u.telefono as conductor_telefono,
                    u.correo as conductor_correo
             FROM camiones c
             LEFT JOIN usuarios u ON c.conductor_id = u.id
             WHERE c.placa = $1 AND c.eliminado = false`,
            [placa]
        );
        return result.rows[0] || null;
    },

    getConductorByPlaca: async (placa) => {
        const result = await db.query(
            `SELECT conductor_id FROM camiones
            WHERE placa = $1 AND eliminado = false`,
            [placa]
        );
        return result.rows.length > 0 ? result.rows[0].conductor_id : null;
    },

    getCamiones: async () => {
        const result = await db.query(`
            SELECT 
                c.*, 
                u.nombre as conductor_nombre, 
                u.cedula as conductor_cedula
            FROM camiones c
            LEFT JOIN usuarios u ON c.conductor_id = u.id
            WHERE c.eliminado = false
            ORDER BY c.placa
        `);
        return result.rows;
    },

    addCamion: async (camionData) => {
        const { placa, tipo_camion, capacidad, conductor_id, habilitado } = camionData;

        const result = await db.query(
            `INSERT INTO camiones (placa, tipo_camion, capacidad, conductor_id, habilitado, eliminado) 
             VALUES ($1, $2, $3, $4, $5, false)
             ON CONFLICT (placa) 
             DO UPDATE SET
                 tipo_camion = EXCLUDED.tipo_camion,
                 capacidad = EXCLUDED.capacidad,
                 conductor_id = EXCLUDED.conductor_id,
                 habilitado = EXCLUDED.habilitado,
                 eliminado = false
             RETURNING *`,
            [placa, tipo_camion, capacidad, conductor_id, habilitado]
        );

        return result.rows[0];
    },

    updateCamion: async (placaOriginal, camionData) => {
        try {
            const { placa, tipo_camion, capacidad, conductor_id, habilitado } = camionData;

            const result = await db.query(
                `UPDATE camiones 
                 SET placa = $1, 
                     tipo_camion = $2, 
                     capacidad = $3, 
                     conductor_id = $4,
                     habilitado = $5
                 WHERE placa = $6 AND eliminado = false
                 RETURNING *`,
                [placa, tipo_camion, capacidad, conductor_id, habilitado, placaOriginal]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error en modelo al actualizar camión:', error);
            throw error;
        }
    },

    deleteCamion: async (placa) => {
        try {
            const result = await db.query(
                `UPDATE camiones SET eliminado = true WHERE placa = $1 AND eliminado = false`,
                [placa]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error en modelo al eliminar camión:', error);
            throw error;
        }
    }
};

module.exports = camionModel;