const mysql = require('mysql')

const connection = mysql.createConnection({
    host : "127.0.0.1",
    port: 3307,
    user : "root",
    password : "CuBe123456",
    database : "world"
});

connection.connect((err)=>{
    if(err) throw err;
});

module.exports = (req,res,next) =>{
    req.db = connection;
    next();
}