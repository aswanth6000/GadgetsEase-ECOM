const mongoose = require('mongoose')
const customerSchema = new mongoose.Schema({
    userId : int,
    complaintHead : String,
    complaintDescription : string
})
module.exports = mongoose.model('Complaint', customerSchema);