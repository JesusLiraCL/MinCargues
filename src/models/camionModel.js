const db = require('../config/database');

const camionModel = {
    getTotalCamionesHabilitados: async () => {
        const result = await db.query(
            `SELECT COUNT(*) as total 
             FROM camiones 
             WHERE habilitado = true`
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
             WHERE c.placa = $1`,
            [placa]
        );
        console.log(result.rows[0]) || null;
        return result.rows[0] || null;
    },
    
    getConductorByPlaca: async (placa) => {
        const result = await db.query(
            `SELECT conductor_id FROM camiones
            WHERE placa = $1`,
            [placa]
        )
        console.log("getConductorByPlaca", result.rows);
        // Return the first conductor_id or null
        return result.rows.length > 0 ? result.rows[0].conductor_id : null;
    },

    getCamiones: async () => {
            const result = await db.query(
                `SELECT * FROM camiones`,
            )
            return result.rows || null;
    },
};

module.exports = camionModel;