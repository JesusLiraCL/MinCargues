const db = require('../config/database');

const clienteModel = {
    getClienteByDocumento: async (documento) => {
        const result = await db.query(
            `Select * FROM clientes WHERE documento = $1`,
            [documento]
        );
        return result.rows[0] || null;
    },
};

module.exports = clienteModel;
