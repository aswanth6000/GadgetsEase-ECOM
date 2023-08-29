const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
    productName : string,
    phone : int,
    address : string,
    quantity : int,
    paymentMethod : string,
    price : int,
    color : string,
    date : date
})
module.exports = mongoose.model('Order', orderSchema);