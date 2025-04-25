const db = require('../config/database');

const conductorModel = {
    getConductorByCedula: async (cedula) => {
        const result = await db.query(
            `Select * FROM conductores WHERE cedula = $1`,
            [cedula]
        );
        return result.rows[0] || null;
    },
};

module.exports = conductorModel;