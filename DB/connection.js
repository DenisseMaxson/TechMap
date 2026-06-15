const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host     : process.env.DB_HOST     || 'localhost',
  user     : process.env.DB_USER     || 'root',
  password : process.env.DB_PASSWORD || '',
  database : process.env.DB_NAME     || 'techmap_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.message);
    process.exit(1);
  }
  console.log('Conectado a MySQL — techmap_db (Pool activo)');
  connection.release();
});

module.exports = db;