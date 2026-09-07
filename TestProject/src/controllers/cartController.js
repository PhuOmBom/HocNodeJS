const cartService = require('../services/cartService');

async function getCart(req, res, next) {
	try {
		const cart = await cartService.getCart(req.user.userID);
		res.json({ cart: cart || { items: [] } });
	} catch (error) {
		next(error);
	}
}

async function addItem(req, res, next) {
	try {
		const cart = await cartService.addItem(
			req.user.userID,
			req.body.bookId,
			req.body.quantity
		);
		res.json({ cart });
	} catch (error) {
		next(error);
	}
}

async function updateItem(req, res, next) {
	try {
		const bookId = req.params.bookId || req.body.bookId;
		const cart = await cartService.updateItem(
			req.user.userID,
			bookId,
			req.body.quantity
		);
		res.json({ cart });
	} catch (error) {
		next(error);
	}
}

async function removeItem(req, res, next) {
	try {
		const bookId = req.params.bookId || req.body.bookId;
		const cart = await cartService.updateItem(
			req.user.userID,
			bookId,
			0
		);
		res.json({ cart });
	} catch (error) {
		next(error);
	}
}

module.exports = { getCart, addItem, updateItem, removeItem };