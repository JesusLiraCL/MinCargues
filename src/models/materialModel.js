const db = require('../config/database');

const materialModel = {
    getMaterialCodeByName: async (nombre) => {
        try {
            const result = await db.query(
                `SELECT codigo FROM materiales WHERE nombre = $1`,
                [nombre]
            );
            return result.rows[0]?.codigo;
        } catch (error) {
            console.error('Error al obtener código de material:', error);
            return null;
        }
    }
};

module.exports = materialModel;