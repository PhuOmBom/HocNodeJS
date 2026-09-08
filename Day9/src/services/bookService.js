const mongoose = require("mongoose");
const Book = require("../models/Book");

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid book id");
  }
}

async function addBook(data, currentUser) {
  const book = await Book.create({
    title: data.title,
    author: data.author,
    category: data.category || "General",
    available: data.available !== undefined ? data.available : true,
    createdBy: currentUser.userId,
  });

  return book;
}

/**
 * Bài 3: Tìm danh sách sách, hỗ trợ filter theo category (?category=Programming)
 * Nếu không có sách phù hợp trả về []
 */
async function listBooks(query = {}) {
  const filter = {};

  if (query.category) {
    // Tìm kiếm theo category không phân biệt hoa thường
    filter.category = { $regex: new RegExp(`^${query.category.trim()}$`, "i") };
  }

  return Book.find(filter).populate("createdBy", "name email");
}

async function findBook(id) {
  validateObjectId(id);

  const book = await Book.findById(id).populate("createdBy", "name email");
  if (!book) {
    throw new Error("Book not found");
  }

  return book;
}

async function editBook(id, data) {
  validateObjectId(id);

  const book = await Book.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!book) {
    throw new Error("Book not found");
  }

  return book;
}

async function removeBook(id) {
  validateObjectId(id);

  const book = await Book.findByIdAndDelete(id);
  if (!book) {
    throw new Error("Book not found");
  }

  return { message: "Book deleted successfully" };
}

module.exports = {
  addBook,
  listBooks,
  findBook,
  editBook,
  removeBook,
};
