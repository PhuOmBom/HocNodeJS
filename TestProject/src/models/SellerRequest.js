const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  storeName: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt: Date,
  reviewedBy: String
}, { timestamps: true });

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);