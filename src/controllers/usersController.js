const db = require("../models/usersModel");

async function getUsers(req, res) {
    const result = await db.getUsers();
    const users = result.rows
    console.log("Usernames: ", users);
    res.send("Usernames: " + users.map(user => `${user.nombre} ${user.contrasena} ${user.codigo_rol}`).join("\t"));
}

module.exports = {
    getUsers,
};