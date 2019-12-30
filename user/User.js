var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'remotemysql.com',
  user     : '09Tv8SoMf4',
  password : 'KTu8h9lFvt',
  database : '09Tv8SoMf4'
});

module.exports = mongoose.model('User');