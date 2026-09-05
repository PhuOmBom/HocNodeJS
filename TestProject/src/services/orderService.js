const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function createOrder(customerID, shipping, paymentMethod = 'cod') {
  const cart = await Cart.findOne({ userID: customerID }).populate('items.bookId');
  if (!cart || cart.items.length === 0) throw Object.assign(new Error('Your cart is empty.'), { statusCode: 400 });
  const items = [];
  let total = 0;
  for (const cartItem of cart.items) {
    const book = await Book.findOneAndUpdate({ _id: cartItem.bookId._id, status: 'active', stock: { $gte: cartItem.quantity } }, { $inc: { stock: -cartItem.quantity, sold: cartItem.quantity } }, { new: true });
    if (!book) throw Object.assign(new Error(`Not enough stock for ${cartItem.bookId.title}.`), { statusCode: 409 });
    const subtotal = book.price * cartItem.quantity;
    total += subtotal;
    items.push({ bookId: book._id, sellerId: book.sellerId, title: book.title, quantity: cartItem.quantity, price: book.price, subtotal });
  }
  const order = await Order.create({ customerID, items, total, shipping, paymentMethod });
  await Cart.deleteOne({ userID: customerID });
  return order;
}

function listOrders(user) {
  if (user.role === 'admin') return Order.find().sort({ createdAt: -1 });
  if (user.role === 'seller') return Order.find({ 'items.sellerId': user.userID }).sort({ createdAt: -1 });
  return Order.find({ customerID: user.userID }).sort({ createdAt: -1 });
}

async function updateStatus(id, status, user) {
  const filter = user.role === 'admin' ? { _id: id } : { _id: id, 'items.sellerId': user.userID };
  return Order.findOneAndUpdate(filter, { status }, { new: true, runValidators: true });
}

module.exports = { createOrder, listOrders, updateStatus };