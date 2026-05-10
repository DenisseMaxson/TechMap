const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host     : process.env.DB_HOST     || 'localhost',
  user     : process.env.DB_USER     || 'root',
  password : process.env.DB_PASSWORD || '',
  database : process.env.DB_NAME     || 'techmap_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.message);
    process.exit(1);
  }
  console.log('Conectado a MySQL — techmap_db');
});

module.exports = db;