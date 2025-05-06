const db = require('../config/database');

const clienteModel = {
    getClienteByDocumento: async (documento) => {
        const result = await db.query(
            `Select * FROM clientes WHERE documento = $1`,
            [documento]
        );
        return result.rows[0] || null;
    },

    getClientes: async () => {
        const result = await db.query(
            `SELECT * FROM clientes`,
        )
        return result.rows || null;
    },

    // En tu clienteModel.js
    addCliente: async (clienteData) => {
        const { documento, nombre, direccion, contacto, correo } = clienteData;
        const result = await db.query(
            `INSERT INTO clientes (documento, nombre, direccion, contacto, correo) VALUES ($1, $2, $3, $4, $5)`,
            [documento, nombre, direccion, contacto, correo]
        );
        return result.rowCount > 0;
    }
};

module.exports = clienteModel;
