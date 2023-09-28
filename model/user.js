const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
