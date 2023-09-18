const mongoose = require('mongoose');

const categotrySchema = new mongoose.Schema({
    category : {
        type : String,
        unique : true
    }
});

module.exports = mongoose.model('Category', categotrySchema);
