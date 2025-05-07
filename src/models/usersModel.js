const db = require("../config/database");

const usersModel = {
    getUsers: async () => {
        const result = await db.query(
            `SELECT 
                usuarios.id, 
                usuarios.nombre_usuario, 
                roles.nombre AS rol, 
                usuarios.cedula,
                usuarios.nombre,
                usuarios.edad,
                usuarios.telefono,
                usuarios.correo
            FROM usuarios
            LEFT JOIN roles ON usuarios.codigo_rol = roles.codigo_rol
            WHERE usuarios.eliminado = false`
        );
        return result.rows || null;
    },

    findByUsername: async (nombre_usuario) => {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND eliminado = false',
            [nombre_usuario]
        );
        return result.rows[0] || null;
    },

    findById: async (id) => {
        const result = await db.query(
            'SELECT id, cedula, nombre FROM usuarios WHERE id = $1 AND eliminado = false',
            [id]
        );
        return result.rows[0] || null;
    },

    findByCedula: async (cedula) => {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE cedula = $1 AND eliminado = false',
            [cedula]
        );
        return result.rows[0] || null;
    },

    createUser: async (userData) => {
        const { nombre_usuario, cedula, nombre, edad, telefono, correo, rol, contrasena } = userData;

        // Primero obtenemos el código_rol
        const rolResult = await db.query(
            'SELECT codigo_rol FROM roles WHERE nombre = $1',
            [rol]
        );

        if (!rolResult.rows[0]) {
            throw new Error('Rol no encontrado');
        }

        const codigo_rol = rolResult.rows[0].codigo_rol;

        const result = await db.query(
            `INSERT INTO usuarios (
                nombre_usuario, 
                cedula, 
                nombre, 
                edad, 
                telefono, 
                correo, 
                codigo_rol,
                contrasena,
                eliminado
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
            RETURNING *`,
            [nombre_usuario, cedula, nombre, edad, telefono, correo, codigo_rol, contrasena]
        );

        return result.rows[0];
    },

    updateUser: async (nombre_original, userData) => {
        const { nombre_usuario: nuevo_nombre, cedula, nombre, edad, telefono, correo, rol } = userData;

        // Obtener código_rol en una línea
        const codigo_rol = rol ? (await db.query('SELECT codigo_rol FROM roles WHERE nombre = $1', [rol])).rows[0]?.codigo_rol : null;
        if (rol && !codigo_rol) throw new Error('Rol no encontrado');

        const result = await db.query(
            `UPDATE usuarios 
             SET nombre_usuario = $1, 
                 cedula = $2, 
                 nombre = $3, 
                 edad = $4, 
                 telefono = $5, 
                 correo = $6,
                 codigo_rol = $7
             WHERE nombre_usuario = $8
             RETURNING *`,
            [
                nuevo_nombre, cedula, nombre, edad, telefono, correo,
                codigo_rol, nombre_original
            ]
        );

        return result.rows[0] || null;
    },

    deleteUser: async (nombre_usuario) => {
        const result = await db.query(
            'UPDATE usuarios SET eliminado = true WHERE nombre_usuario = $1 AND eliminado = false RETURNING *',
            [nombre_usuario]
        );
        return result.rows[0] || null;
    }
};

module.exports = usersModel;