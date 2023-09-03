const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    type: String,
    phone: String,
    houseName: String,
    name: String,
    street: String,
    city: String,
    state: String,
    pinCode: String
});

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    phoneNumber: String,
    addresses: [addressSchema],
    email: String,
    verified: Boolean,
    profileImage: String,
    cart: [cartItemSchema], 
});

module.exports = mongoose.model('User', userSchema);
