const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cover: { type: String, default: '' },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  price: { type: Number, required: true, min: 0, default: 0 },
  originalPrice: { type: Number, min: 0 },
  stock: { type: Number, min: 0, default: 0 },
  sold: { type: Number, min: 0, default: 0 },
  publisher: { type: String, trim: true },
  publishedYear: { type: Number },
  isbn: { type: String, trim: true },
  language: { type: String, trim: true, default: 'English' },
  pages: { type: Number, min: 0 },
  format: { type: String, enum: ['Paperback', 'Hardcover', 'Ebook'], default: 'Paperback' },
  sellerId: { type: String, index: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
  featured: { type: Boolean, default: false },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);