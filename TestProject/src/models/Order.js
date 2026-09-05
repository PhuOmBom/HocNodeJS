const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true, default: () => `BO-${Date.now()}-${Math.floor(Math.random() * 10000)}` },
  customerID: { type: String, required: true, index: true },
  items: [{ bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }, sellerId: String, title: String, quantity: Number, price: Number, subtotal: Number }],
  total: { type: Number, required: true, min: 0 },
  shipping: { fullName: String, phone: String, address: String, city: String, district: String, ward: String },
  paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);