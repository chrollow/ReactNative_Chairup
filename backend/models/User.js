const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  phone: {
    type: String
  },
  profile_image: {
    type: String
  },
  facebook_id: {
    type: String
  },
  google_id: {
    type: String
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('User', UserSchema);