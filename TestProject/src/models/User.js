const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  userID: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'customer', 'seller', 'admin'], default: 'customer' },
  status: { type: String, enum: ['logged_in', 'offline'], default: 'offline' },
  avatar: { type: String, default: '' },
  phone: {
    type: String,
    trim: true,
    default: '',
    index: {
      unique: true,
      partialFilterExpression: { phone: { $type: 'string', $gt: '' } }
    }
  },
  address: { type: String, trim: true, default: '' },
  shippingAddresses: [{
    label: { type: String, default: 'Nhà riêng' },
    recipientName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
  }],
  isBanned: { type: Boolean, default: false },
  sellerProfile: {
    storeName: { type: String, trim: true, maxlength: 120 },
    address: { type: String, trim: true, maxlength: 240 },
    phone: { type: String, trim: true, maxlength: 30 },
    description: { type: String, trim: true, maxlength: 1000 }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);