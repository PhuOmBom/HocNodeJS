const bookService = require('../services/bookService');

async function listBooks(req, res, next) {
	try {
		const books = await bookService.listBooks(req.query);
		res.json({ books });
	} catch (error) {
		next(error);
	}
}

async function getBook(req, res, next) {
	try {
		const book = await bookService.getBook(req.params.id);
		if (!book) return res.status(404).json({ message: 'Book not found.' });
		res.json({ book });
	} catch (error) {
		next(error);
	}
}

async function createBook(req, res, next) {
	try {
		const book = await bookService.createBook(req.body, req.user);
		res.status(201).json({ book });
	} catch (error) {
		next(error);
	}
}

async function updateBook(req, res, next) {
	try {
		const book = await bookService.updateBook(req.params.id, req.body, req.user);
		if (!book) return res.status(404).json({ message: 'Book not found or not owned by you.' });
		res.json({ book });
	} catch (error) {
		next(error);
	}
}

async function deleteBook(req, res, next) {
	try {
		const book = await bookService.deleteBook(req.params.id, req.user);
		if (!book) return res.status(404).json({ message: 'Book not found or not owned by you.' });
		res.json({ message: 'Book deleted successfully.' });
	} catch (error) {
		next(error);
	}
}

module.exports = { listBooks, getBook, createBook, updateBook, deleteBook };