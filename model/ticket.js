const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default : 'Open' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true, },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, },
});

module.exports = mongoose.model('Ticket', ticketSchema);