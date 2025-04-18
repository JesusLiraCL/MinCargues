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
};

module.exports = camionModel;