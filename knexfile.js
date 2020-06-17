require("dotenv").config();

module.exports = {
  client: "mysql",
  connection: {
    host: process.env.HOST,
    port: process.env.DB_PORT,
    database: process.env.DB,
    user: process.env.USER,
    password: process.env.MYSQL_PASSWORD,
    ssl: true,
  },
};
