// require('dotenv').config();
require('dotenv').config({ path: `${__dirname}/.env` });

const _ = require('lodash'),
      chalk = require('chalk'),
      emoji = require('node-emoji'),
      inquirer = require('inquirer'),
      mysql = require('mysql'),
      bamazon = chalk`{bold.hex('#FF8C00') bamazon}`;

const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: process.env.MYSQL_DB_ROOT_PASSWD,
  database: 'bamazon_db'
});

conn.connect();

const getStoreDeals = () => {
  const welcomeMsg = chalk`Welcome to ${bamazon}, the online store for {italic all} your shopping needs!\nHere\'s a list of the incredible deals we have for you today:\n`;

  console.log(welcomeMsg);

  return new Promise((resolve, reject) => {
    const query = 'SELECT item_id, product_name, price FROM products;'
    
    conn.query(query, (err, res) => {
      if (err) {
        reject(emoji.emojify(`${bamazon} has no deals for you today. :no_entry_sign:`));
      }

      const itemNoHeader = chalk`{bold.hex('#C0C0C0').underline Item No.  }`,
            productHeader = chalk`{bold.hex('#C0C0C0').underline Product                                   }`,
            priceHeader = chalk`{bold.hex('#C0C0C0').underline Price     }`,
            spacer = `     `,
            itemNos = [];

      console.log(`${itemNoHeader}${spacer}${productHeader}${spacer}${priceHeader}`);

      for (let [i, row] of res.entries()) {
        const itemNo = row.item_id,
              productName = chalk`{hex('#FFA500') ${_.padEnd(row.product_name.slice(0, 42), 42)}}`,
              price = _.padStart(row.price, 9);

        itemNos.push(itemNo);

        console.log(`${itemNo}${spacer}${productName}${spacer}$${price}`);

        if ((i + 1) === res.length) {
          console.log('');

          resolve(itemNos);
        }
      }
    });
  });
};

const isStockSuff = (custOrder) => {
  return new Promise((resolve, reject) => {
    const itemID = _.parseInt(custOrder.itemNo),
          qty = _.parseInt(custOrder.quantity);

    let query = 'SELECT stock_quantity, price FROM products WHERE ?'; 

    conn.query(query, { item_id: itemID }, (err, res) => {
      if (err) throw err;

      const stock = _.parseInt(res[0].stock_quantity);

      if (stock > qty) {
        custOrder.itemNo = itemID;
        custOrder.quantity = qty;
        custOrder.stock = stock;
        custOrder.price = res[0].price;
      }

      resolve(custOrder);
    });
  });
};

const placeOrder = (custOrder) => {
  return new Promise((resolve, reject) => {
    isStockSuff(custOrder).then((custOrder) => {
      if ('price' in custOrder) {
        const newStockQty = custOrder.stock - custOrder.quantity,
              orderTotal = custOrder.quantity * custOrder.price;

        let query = 'UPDATE products SET ? WHERE ?'; 

        conn.query(query, [{ stock_quantity: newStockQty }, { item_id: custOrder.itemNo }], (err, res) => {
          if (err || res.changedRows !== 1) {
            // ASSERT: Something went wrong.
            reject(emoji.emojify(chalk`{red Something strange happened. Please contact the ${bamazon} CEO, Geoff Zebos, immediately!} :flushed:\n`));
          }
          else {
            // ASSERT: Query successful and results within acceptable
            //         parameters
            resolve(emoji.emojify(chalk`{bold.green Your order has been successfully placed! Your total is $${orderTotal}. Please visit again soon!} :shopping_bags:\n`));
          }
        });
      }
      else {
        // ASSERT: Product stock insufficient to fulfill order.
        reject(emoji.emojify(chalk`{bold.yellow Insufficient quantity to fulfill your order. Check back again soon!} :-1: \n`));
      }
  });
});
};

getStoreDeals()
  .then((itemNos) => {
    return inquirer.prompt([
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
    ]);
  })
  .then(isStockSuff)
  .then(placeOrder)
  .then((res) => {
    console.log(res);
  })
  .catch(console.error)
  .finally(() => conn.end());
