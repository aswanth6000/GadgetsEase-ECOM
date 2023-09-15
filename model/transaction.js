// models/transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  amount: Number,
  type: String, 
  date: {
    type: Date,
    default: Date.now,
  },
  description : String
});

module.exports = mongoose.model('Transaction', transactionSchema);