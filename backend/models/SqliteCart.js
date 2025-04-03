const { DataTypes } = require('sequelize');
const sequelize = require('../config/sqlite.config');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Create tables if they don't exist
(async () => {
  try {
    await sequelize.sync();
    console.log('SQLite database synchronized');
  } catch (error) {
    console.error('Error synchronizing SQLite database:', error);
  }
})();

module.exports = CartItem;