require('dotenv').config();

module.exports = {
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        port: 3307,
        database: 'webcomputing',
        user: 'root',
        password: process.env.MYSQL_PASSWORD
    }
}