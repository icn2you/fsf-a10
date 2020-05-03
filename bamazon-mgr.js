require('dotenv').config();

const _ = require('lodash'),
      chalk = require('chalk'),
      inquirer = require('inquirer'),
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

  const welcomeMsg = chalk`Welcome to {bold.hex('#FF8C00') bamazon}, the online store for {italic all} your shopping needs!\nHere\'s a list of the incredible deals we have for you today:\n`;

  console.log(welcomeMsg);

  conn.query('SELECT item_id, product_name, price FROM products;', (err, res) => {
    if (err) throw err;

    const itemNoHeader = chalk`{bold.hex('#C0C0C0').underline Item No.  }`,
          productHeader = chalk`{bold.hex('#C0C0C0').underline Product                                                                 }`,
          priceHeader = chalk`{bold.hex('#C0C0C0').underline Price     }`,
          spacer = `     `;

    console.log(`${itemNoHeader}${spacer}${productHeader}${spacer}${priceHeader}`);

    for (let row of res) {
      const productName = chalk`{hex('#FFA500') ${_.padEnd(row.product_name.slice(0, 72), 72)}}`,
            price = _.padStart(row.price, 9);

      console.log(`${row.item_id}${spacer}${productName}${spacer}$${price}`);
    }
  });

  conn.end();
});
