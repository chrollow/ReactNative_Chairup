const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize SQLite with Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/cart.sqlite'),
  logging: false
});

module.exports = sequelize;