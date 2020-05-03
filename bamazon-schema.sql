DROP DATABASE IF EXISTS bamazon_db;
CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE products (
  item_id BIGINT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  department_name ENUM (
	  'Appliances & Electronics',
	  'Books & Audiobooks', 
    'Computers & Tech',
    'Clothing & Accessories',
    'Food & Groceries',
    'Health & Beauty',
    'Housewares & Furniture',
    'Lawn & Garden',
    'Movies & Music',
    'Pet Supplies', 
    'Sporting Goods',
    'Toys') DEFAULT NULL,
  price DECIMAL(19, 4) NOT NULL,
  stock_quantity INT NOT NULL,
  launch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);