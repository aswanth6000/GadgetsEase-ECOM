const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username : String,
    password : String,
    phoneNumber : String,
    address : {
        type : String,
        phone : int,
        houseName : String,
        name : string, 
        street: String,
        city: String,
        state: String,
        pinCode: String, 
    },
    email : String,
    profileImage : String
})
module.exports = mongoose.model('User', userSchema)