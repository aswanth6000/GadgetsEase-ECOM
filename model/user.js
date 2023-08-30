const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username : String,
    password : String,
    phoneNumber : String,
    address : {
        type : String,
        phone : String,
        houseName : String,
        name : String, 
        street: String,
        city: String,
        state: String,
        pinCode: String, 
    },
    email : String,
    verified: Boolean,
    profileImage : String
})
module.exports = mongoose.model('User', userSchema)