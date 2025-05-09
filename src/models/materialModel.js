const db = require('../config/database');

const materialModel = {
    getMaterialCodeByName: async (nombre) => {
        const result = await db.query(
            `SELECT codigo FROM materiales 
             WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) AND eliminado = false`,
            [nombre]
        );
        return result.rows[0]?.codigo || null; // Devuelve el código directamente o null si no existe
    },

    getAllMaterials: async () => {
        try {
            const result = await db.query(
                `SELECT codigo, nombre, unidad_medida 
                 FROM materiales 
                 WHERE eliminado = false
                 ORDER BY codigo`
            );
            return result.rows;
        } catch (error) {
            console.error('Error al obtener lista de materiales:', error);
            return [];
        }
    },

    getEliminadoByNombre: async (nombre) => {
        console.log("nombre en model", nombre);
        const result = await db.query(
            `SELECT * 
            FROM materiales 
            WHERE nombre = $1 AND eliminado = true`,
            [nombre]
        )
        console.log("result en model", result.rows);
        return result.rows[0];
    },

    getMaterialByCodigo: async (codigo) => {
        const result = await db.query(
            `SELECT * FROM materiales WHERE codigo = $1 AND eliminado = false`,
            [codigo]
        );
        return result.rows[0] || null;
    },

    addMaterial: async (materialData) => {
        const { nombre, unidad_medida } = materialData;

        const result = await db.query(
            `INSERT INTO materiales (nombre, unidad_medida, eliminado) 
             VALUES ($1, $2, false)
             RETURNING *`, // Devuelve todas las columnas del material insertado
            [nombre, unidad_medida]
        );
        return result.rows[0]; // Ahora debería contener el material recién insertado
    },

    updateMaterial: async (codigoOriginal, materialData) => {
        try {
            console.log("codigoOriginal en model", codigoOriginal);
            console.log("materialData en model", materialData);
            const { nombre, unidad_medida } = materialData;

            const result = await db.query(
                `UPDATE materiales 
                 SET nombre = $1, 
                     unidad_medida = $2,
                     eliminado = false
                 WHERE codigo = $3
                 RETURNING *`,
                [nombre, unidad_medida, codigoOriginal]
            );
            console.log("2 ", result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('Error en modelo al actualizar material:', error);
            throw error;
        }
    },

    deleteMaterial: async (codigo) => {
        try {
            const result = await db.query(
                `UPDATE materiales SET eliminado = true WHERE codigo = $1 AND eliminado = false`,
                [codigo]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error en modelo al eliminar material:', error);
            throw error;
        }
    }
};

module.exports = materialModel;