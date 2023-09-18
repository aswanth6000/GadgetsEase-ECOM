const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    phoneNumber: String,
    email: String,
    verified: Boolean,
    profileImage: String,
    status: {
        type: String,
        default: 'active',
    },
    createdDate: {
        type: Date,
        default: Date.now,
      },
      walletBalance: {
        type: Number,
        default: 0,
      },
});

module.exports = mongoose.model('User', userSchema);
