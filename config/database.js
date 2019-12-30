const mysql      = require('mysql');

const connection = mysql.createConnection({
    host      : process.env.host,
    user      : process.env.user,
    password  : process.env.password,
    database  : process.env.database,
    multipleStatements: true
  });


  module.exports = connection;
  