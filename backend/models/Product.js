const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: 'Office'
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  stockQuantity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Product', ProductSchema);