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
    }
};

module.exports = clienteModel;
