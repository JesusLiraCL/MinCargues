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
            `Select * FROM camiones WHERE placa = $1`,
            [placa]
        );
        return result.rows[0] || null;
    },
};

module.exports = camionModel;