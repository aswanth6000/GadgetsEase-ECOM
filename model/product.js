const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name : string,
    category : string, 
    price : int,
    discountPrice : int,
    quantity : int,
    productImage : string ,
    productColor : string,
    rating :{
        userId: string,
        rating : int,
        review : string,
        date : Date
    },
    details : {
        ram : string,
        rom : string,
        expandable : string,
        frontCam : string,
        rearCam : string, 
        processor : string
    }
})
module.exports = mongoose.model('Products', productSchema)