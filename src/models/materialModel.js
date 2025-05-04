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
    },

    getAllMaterials: async () => {
        try {
            const result = await db.query(
                `SELECT codigo, nombre, unidad_medida FROM materiales ORDER BY codigo`
            );
            return result.rows;
        } catch (error) {
            console.error('Error al obtener lista de materiales:', error);
            return [];
        }
    },
};

module.exports = materialModel;