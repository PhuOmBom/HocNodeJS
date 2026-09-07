const Cart = require('../models/Cart');
const Book = require('../models/Book');

function createServiceError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

async function getCart(userID) {
  const cart = await Cart.findOne({ userID }).populate('items.bookId');
  if (cart && Array.isArray(cart.items)) {
    const validItems = cart.items.filter((item) => item && item.bookId);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }
  }
  return cart;
}

async function addItem(userID, bookId, quantity = 1) {
  const book = await Book.findOne({ _id: bookId, status: 'active' });
  if (!book) throw createServiceError('Book not found.', 404);

  const itemQuantity = Number(quantity);
  if (itemQuantity < 1) {
    throw createServiceError('Quantity must be at least 1.', 400);
  }

  const cart = await Cart.findOneAndUpdate({ userID }, { $setOnInsert: { userID } }, { new: true, upsert: true });
  const item = cart.items.find((entry) => entry.bookId && entry.bookId.toString() === bookId);
  if (item) item.quantity += itemQuantity;
  else cart.items.push({ bookId, quantity: itemQuantity });

  const updatedItem = cart.items.find((entry) => entry.bookId && entry.bookId.toString() === bookId);
  if (updatedItem.quantity > book.stock) {
    throw createServiceError(`Only ${book.stock} copies are available.`, 409);
  }

  await cart.save();
  return getCart(userID);
}

async function updateItem(userID, bookId, quantity) {
  const cart = await Cart.findOne({ userID });
  if (!cart) return null;
  const item = cart.items.find((entry) => entry.bookId && entry.bookId.toString() === bookId);
  if (!item) return getCart(userID);

  const book = await Book.findById(bookId);
  if (!book) {
    cart.items = cart.items.filter((entry) => entry.bookId && entry.bookId.toString() !== bookId);
    await cart.save();
    return getCart(userID);
  }

  const itemQuantity = Number(quantity);
  if (itemQuantity <= 0) {
    cart.items = cart.items.filter((entry) => entry.bookId && entry.bookId.toString() !== bookId);
  } else if (itemQuantity > book.stock) {
    throw createServiceError(`Only ${book.stock} copies are available.`, 409);
  } else {
    item.quantity = itemQuantity;
  }

  await cart.save();
  return getCart(userID);
}

module.exports = { getCart, addItem, updateItem };