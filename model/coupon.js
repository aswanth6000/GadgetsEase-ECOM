// models/coupon.js

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  type :{
    type : String,
    required : true
  },
  expiry: {
    type: Date,
    required: true,
  },
  // Add an array to track which users have used this coupon
  usersUsed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
