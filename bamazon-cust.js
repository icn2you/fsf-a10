// require('dotenv').config();
require('dotenv').config({path: `${__dirname}/.env`});

const _ = require('lodash'),
      chalk = require('chalk'),
      inquirer = require('inquirer'),
      keys = require('./keys.js'),
      mysql = require('mysql'),
      bamazon = chalk`{bold.hex('#FF8C00') bamazon}`;

const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: keys.db.passwd,
  database: 'bamazon_db'
});

const getDeals = new Promise(async (resolve, reject) => {
  try {
    conn.connect((err) => {
      if (err) throw err;

      const welcomeMsg = chalk`Welcome to ${bamazon}, the online store for {italic all} your shopping needs!\nHere\'s a list of the incredible deals we have for you today:\n`;

      console.log(welcomeMsg);

      conn.query('SELECT item_id, product_name, price FROM products;', (err, res) => {
        if (err) throw err;

        const itemNoHeader = chalk`{bold.hex('#C0C0C0').underline Item No.  }`,
              productHeader = chalk`{bold.hex('#C0C0C0').underline Product                                   }`,
              priceHeader = chalk`{bold.hex('#C0C0C0').underline Price     }`,
              spacer = `     `,
              itemNos = [];

        console.log(`${itemNoHeader}${spacer}${productHeader}${spacer}${priceHeader}`);

        let productCount = 0;

        for (let row of res) {
          const itemNo = row.item_id,
                productName = chalk`{hex('#FFA500') ${_.padEnd(row.product_name.slice(0, 42), 42)}}`,
                price = _.padStart(row.price, 9);

          itemNos.push(itemNo);

          console.log(`${itemNo}${spacer}${productName}${spacer}$${price}`);

          productCount++;

          if (productCount === res.length) {
            console.log('');

            // resolve(`${bamazon} is open for business!`);
            resolve(itemNos);
          }
        }
      });

      conn.end();
    });
  }
  catch(err) {
    reject(`${bamazon} has no deals for you today. `);
  }
});

getDeals
  .then((res) => {
    const itemNos = res;

    inquirer
      .prompt([
        {
          name: 'itemNo',
          message: 'What is the Item No. of the product you wish to buy?',
          type: 'input',
          validate: (itemNo) => {
            return (itemNos.indexOf(_.parseInt(itemNo)) >= 0) || 
              chalk`{red Invalid Item No. entered.}`;
          },
        },
        {
          name: 'quantity',
          message: 'How many do you wish to buy?',
          type: 'input',
          validate: (quantity) => {
            const regEx = /^\d+$/;
            
            return (regEx.test(quantity) && quantity > 0) || 
              chalk`{red Invalid quantity specified!}`;
          },
        },
      ])
      .then((ans) => {
        console.log(ans);

        if (itemNos.indexOf(itemNo) < 0)
          throw chalk`{red Invalid Item No. entered.}`;

        if (quantity < 0)
          throw chalk`{red Invalid quantity specified!}`;

      })
      .catch((err) => {
        if(err.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else when wrong
        }
      });
  }, (err) => {
    console.error(err);
  });
