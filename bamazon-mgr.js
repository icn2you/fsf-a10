require('dotenv').config();

const inquirer = require('inquirer'),
      keys = require('./keys.js'),
      mysql = require('mysql');

const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: keys.db.passwd,
  database: 'bamazon_db'
});

conn.connect((err) => {
  if (err) throw err;

  conn.query('SELECT * FROM products;', (err, res) => {
    if (err) throw err;

    for (let row of res) {
      console.log(`${row.product_name} - $${row.price}`);
    }
  });

  conn.end();
});
