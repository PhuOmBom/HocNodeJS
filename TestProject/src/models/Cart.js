const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  items: [{ bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }, quantity: { type: Number, min: 1, required: true } }]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);