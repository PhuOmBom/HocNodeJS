const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function overview() {
  const [users, books, orders, revenue] = await Promise.all([User.countDocuments(), Book.countDocuments({ status: 'active' }), Order.countDocuments(), Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }])]);
  return { users, books, orders, revenue: revenue[0]?.total || 0 };
}
function listUsers() { return User.find().select('-password').sort({ createdAt: -1 }); }
function updateBan(userID, isBanned) { return User.findOneAndUpdate({ userID, role: { $ne: 'admin' } }, { isBanned, status: isBanned ? 'offline' : 'offline' }, { new: true }).select('-password'); }
function updateRole(userID, role) { return User.findOneAndUpdate({ userID, role: { $ne: 'admin' } }, { role }, { new: true, runValidators: true }).select('-password'); }

async function sellerMetrics(userID) {
  const [books, orders] = await Promise.all([Book.find({ sellerId: userID }).sort({ createdAt: -1 }), Order.find({ 'items.sellerId': userID }).sort({ createdAt: -1 })]);
  const items = orders.flatMap((order) => order.items.filter((item) => item.sellerId === userID));
  return { books, orders, totalProducts: books.length, totalSold: items.reduce((sum, item) => sum + item.quantity, 0), totalRevenue: items.reduce((sum, item) => sum + item.subtotal, 0) };
}

module.exports = { overview, listUsers, updateBan, updateRole, sellerMetrics };