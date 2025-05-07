const db = require('../config/database');

const clienteModel = {
    getClienteByDocumento: async (documento) => {
        const result = await db.query(
            `SELECT * FROM clientes WHERE documento = $1 AND eliminado = false`,
            [documento]
        );
        return result.rows[0] || null;
    },

    getClientes: async () => {
        const result = await db.query(
            `SELECT * FROM clientes WHERE eliminado = false`,
        )
        return result.rows || null;
    },

    // En tu clienteModel.js
    addCliente: async (clienteData) => {
        const { documento, nombre, direccion, contacto, correo } = clienteData;
        
        const result = await db.query(
            `INSERT INTO clientes (documento, nombre, direccion, contacto, correo, eliminado) 
             VALUES ($1, $2, $3, $4, $5, false)
             ON CONFLICT (documento) 
             DO UPDATE SET
                 nombre = EXCLUDED.nombre,
                 direccion = EXCLUDED.direccion,
                 contacto = EXCLUDED.contacto,
                 correo = EXCLUDED.correo,
                 eliminado = false
             RETURNING *`,
            [documento, nombre, direccion, contacto, correo]
        );
        
        return result.rows[0];
    },

    updateCliente: async (documentoOriginal, clienteData) => {
        try {
            const { documento, nombre, direccion, contacto, correo } = clienteData;

            const result = await db.query(
                `UPDATE clientes 
                 SET documento = $1, 
                     nombre = $2, 
                     direccion = $3, 
                     contacto = $4, 
                     correo = $5
                 WHERE documento = $6 AND eliminado = false
                 RETURNING *`,
                [documento, nombre, direccion, contacto, correo, documentoOriginal]
            );

            return result.rows[0]; // Devuelve el cliente actualizado
        } catch (error) {
            console.error('Error en modelo al actualizar cliente:', error);
            throw error; // Propaga el error para manejarlo en el controlador
        }
    },

    deleteCliente: async (documento) => {
        try {
            const result = await db.query(
                `UPDATE clientes SET eliminado = true WHERE documento = $1 AND eliminado = false`,
                [documento]
            );
            return result.rowCount > 0; // Retorna true si se marcó como eliminado, false si no se encontró o ya estaba eliminado
        } catch (error) {
            console.error('Error en modelo al eliminar cliente:', error);
            throw error; // Propaga el error para manejarlo en el controlador
        }
    },
};

module.exports = clienteModel;
