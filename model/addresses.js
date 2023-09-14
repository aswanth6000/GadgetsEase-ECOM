const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: String,
  phone: String,
  houseName: String,
  name: String,
  street: String,
  city: String,
  state: String,
  pinCode: String,
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Address', addressSchema);
