const db = require("../config/database");

usersModel = {
    getUsers: async () => {
        const rows = db.query("SELECT * FROM usuarios");
        return rows;
    },

    findByUsername: async (nombre_usuario) => {
        const query = 'SELECT * FROM usuarios WHERE nombre_usuario = $1';
        const { rows } = await db.query(query, [nombre_usuario]);

        return rows[0] || null;
    },

    findById: async (id) => {
        const query = 'SELECT id, cedula, nombre FROM usuarios WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0] || null;
    },

    getConductorByCedula: async (cedula) => {
        const result = await db.query(
            `SELECT u.*
             FROM usuarios u
             JOIN roles r ON u.codigo_rol = r.codigo_rol
             WHERE u.cedula = $1 AND u.codigo_rol = 'ROL002'`,
            [cedula]
        );
        return result.rows[0] || null;
    },

};

module.exports = usersModel;