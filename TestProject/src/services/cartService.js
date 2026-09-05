const Cart = require('../models/Cart');
const Book = require('../models/Book');

async function getCart(userID) { return Cart.findOne({ userID }).populate('items.bookId'); }

async function addItem(userID, bookId, quantity = 1) {
  const book = await Book.findOne({ _id: bookId, status: 'active' });
  if (!book) throw Object.assign(new Error('Book not found.'), { statusCode: 404 });
  if (Number(quantity) < 1) throw Object.assign(new Error('Quantity must be at least 1.'), { statusCode: 400 });
  const cart = await Cart.findOneAndUpdate({ userID }, { $setOnInsert: { userID } }, { new: true, upsert: true });
  const item = cart.items.find((entry) => entry.bookId.toString() === bookId);
  if (item) item.quantity += Number(quantity);
  else cart.items.push({ bookId, quantity: Number(quantity) });
  const updatedItem = cart.items.find((entry) => entry.bookId.toString() === bookId);
  if (updatedItem.quantity > book.stock) throw Object.assign(new Error(`Only ${book.stock} copies are available.`), { statusCode: 409 });
  await cart.save();
  return getCart(userID);
}

async function updateItem(userID, bookId, quantity) {
  const cart = await Cart.findOne({ userID });
  if (!cart) return null;
  const item = cart.items.find((entry) => entry.bookId.toString() === bookId);
  if (!item) return cart;
  const book = await Book.findById(bookId);
  if (!book) throw Object.assign(new Error('Book not found.'), { statusCode: 404 });
  if (Number(quantity) <= 0) cart.items = cart.items.filter((entry) => entry.bookId.toString() !== bookId);
  else if (Number(quantity) > book.stock) throw Object.assign(new Error(`Only ${book.stock} copies are available.`), { statusCode: 409 });
  else item.quantity = Number(quantity);
  await cart.save();
  return getCart(userID);
}

module.exports = { getCart, addItem, updateItem };