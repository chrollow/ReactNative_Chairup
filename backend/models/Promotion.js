const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  expiryDate: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Promotion', PromotionSchema);