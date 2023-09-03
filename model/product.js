const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: String,
    rating: Number,
    review: String,
    date: Date,
    image: String, // You can store the image URL or path as a string
});

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    discountPrice: Number,
    quantity: Number,
    productImages: [String],
    video : String,
    productColor: String,
    ratings: [ratingSchema], // Use the ratingSchema as an array of ratings
    details: {
        ram: String,
        rom: String,
        expandable: String,
        frontCam: String,
        rearCam: String,
        processor: String,
    },
});

module.exports = mongoose.model('Product', productSchema);
