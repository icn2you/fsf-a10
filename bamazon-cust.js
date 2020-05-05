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

const storeDeals = new Promise(async (resolve, reject) => {
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
    });
  }
  catch(err) {
    reject(`${bamazon} has no deals for you today. `);
  }
});

const custOrder = new Promise((resolve, reject) => {
  storeDeals
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
        resolve(ans);
      })
      .catch((err) => {
        reject(err);
      });
    });
});

const qs = new Promise(async (resolve, reject) => {
  custOrder
    .then((res) => {
      const custOrder = res;

      try {
        const itemID = _.parseInt(res.itemNo),
              qty = _.parseInt(res.quantity);

        let query = 'SELECT stock_quantity, price FROM products WHERE ?'; 

        conn.query(query, { item_id: itemID }, (err, res) => {
          if (err) throw err;

          const stock = _.parseInt(res[0].stock_quantity);

          if (stock > qty) {
            custOrder.itemNo = itemID;
            custOrder.quantity = qty;
            custOrder.stock = stock;
            custOrder.price = res[0].price;

            resolve(custOrder);
          }
          else {
            throw chalk`{red Insufficient quantity to fulfill your order. Check back again soon!}`;
          }
        });
      }
      catch(err) {
        reject(err);
      }
    });
});

const successfulOrder = new Promise((resolve, reject) => {
  qs
    .then((res) => {
      const newStockQty = res.stock - res.quantity,
            orderTotal = res.quantity * res.price;
      
      try {
        let query = 'UPDATE products SET ? WHERE ?'; 

        conn.query(query, [{ stock_quantity: newStockQty }, { item_id: res.itemNo }], (err, res) => {
          if (err) throw err;     

          if (res.changedRows === 1) {
            resolve(chalk`{green Your order has been successfully placed! Your total is $${orderTotal}. Please visit again soon!}`);
          }
          else if (res.changedRows > 0) {
            throw chalk`{red Something strange happened. Please contact the ${bamazon} CEO, Geoff Zebos, immediately! }`;
          }
          else {
            throw chalk`{red Insufficient quantity to fulfill your order. Check back again soon!}`;
          }
        });

        conn.end();
      }
      catch(err) {
        reject(err);
      }
    });
});

successfulOrder
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.err(err);
  });