const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to the Product model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  starRating: {
    type: Number,
    required: true,
    min: 1, // Minimum rating value
    max: 5, // Maximum rating value
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // Default to the current date and time
  },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
