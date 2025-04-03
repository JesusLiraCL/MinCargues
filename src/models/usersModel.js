const pool = require("../config/database");

module.exports = {
    async getUsers() {
        const rows = pool.query("SELECT * FROM usuarios");
        return rows;
    },

    async findByUsername(nombre) {  // Cambiado de username a nombre
        const query = 'SELECT * FROM usuarios WHERE nombre = $1';  // Cambiado a nombre
        const { rows } = await pool.query(query, [nombre]);

        console.log('Usuario encontrado:', rows[0]); // Debug
        return rows[0] || null;
    },

    async findById(id) {
        const query = 'SELECT id, nombre FROM usuarios WHERE id = $1'; // Cambiado a nombre
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }
};