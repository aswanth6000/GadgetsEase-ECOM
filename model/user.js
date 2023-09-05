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

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    phoneNumber: String,
    addresses: [addressSchema],
    email: String,
    verified: Boolean,
    profileImage: String,
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: Number,
        },
    ],
    status: {
        type: String,
        default: 'active',
    },
});

module.exports = mongoose.model('User', userSchema);
