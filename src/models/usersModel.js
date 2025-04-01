const pool = require("../config/database");

async function getUsers() {
    const rows = pool.query("SELECT * FROM usuarios");
    return rows;
}

module.exports = {
    getUsers,
}