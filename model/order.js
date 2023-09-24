const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  status: {
    type: String,
    default: 'pending',
  },
  totalAmount : Number,
  paymentMethod: String,
  paymentStatus: String, 
  paymentTransactionId: String, 
  paymentDate: Date, 
  paymentAmount: Number, 
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: Number,
      price: Number,
    },
  ],
});

module.exports = mongoose.model('Order', orderSchema);
