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

    updateUser: async (nombre_usuario, userData) => {
        const { cedula, nombre, edad, telefono, correo, rol } = userData;
        
        // Obtenemos el código_rol si se proporciona un rol
        let codigo_rol = null;
        if (rol) {
            const rolResult = await db.query(
                'SELECT codigo_rol FROM roles WHERE nombre = $1',
                [rol]
            );
            
            if (!rolResult.rows[0]) {
                throw new Error('Rol no encontrado');
            }
            
            codigo_rol = rolResult.rows[0].codigo_rol;
        }

        // Construimos la consulta de actualización
        const query = `
            UPDATE usuarios 
            SET cedula = $1, 
                nombre = $2, 
                edad = $3, 
                telefono = $4, 
                correo = $5,
                ${codigo_rol ? 'codigo_rol = $6,' : ''}
                nombre_usuario = $${codigo_rol ? '7' : '6'}
            WHERE nombre_usuario = $${codigo_rol ? '7' : '6'} AND eliminado = false
            RETURNING *`;
        
        const params = [
            cedula, 
            nombre, 
            edad, 
            telefono, 
            correo
        ];
        
        if (codigo_rol) {
            params.push(codigo_rol);
        }
        params.push(nombre_usuario);

        const result = await db.query(query, params);
        return result.rows[0];
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