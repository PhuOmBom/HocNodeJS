const Book = require('../models/Book');

function listBooks(query = {}) {
	const filter = { status: 'active' };
	if (query.category) {
		filter.$or = [{ category: query.category }, { categories: query.category }];
	}
	if (query.search) {
		const searchOr = [{ title: new RegExp(query.search, 'i') }, { author: new RegExp(query.search, 'i') }, { isbn: new RegExp(query.search, 'i') }, { publisher: new RegExp(query.search, 'i') }];
		if (filter.$or) {
			filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
			delete filter.$or;
		} else {
			filter.$or = searchOr;
		}
	}
	const sort = query.sort === 'price_asc' ? { price: 1 } : query.sort === 'price_desc' ? { price: -1 } : query.sort === 'rating' ? { rating: -1 } : { sold: -1, createdAt: -1 };
	return Book.find(filter).populate('category').populate('categories').sort(sort);
}
function getBook(id) { return Book.findById(id).populate('category').populate('categories'); }
function validateImages(data) {
	const images = Array.isArray(data.images) ? data.images : [];
	if (!data.cover || !data.cover.startsWith('data:image/')) throw Object.assign(new Error('At least one valid Base64 image is required.'), { statusCode: 400 });
	if (images.length === 0 || images.some((image) => !image.startsWith('data:image/'))) throw Object.assign(new Error('All book images must be valid Base64 images.'), { statusCode: 400 });
	if (images.reduce((total, image) => total + image.length, 0) >= 12 * 1024 * 1024) throw Object.assign(new Error('The total image data must be smaller than 12MB.'), { statusCode: 400 });
}
function createBook(data, user) {
	validateImages(data);
	const categories = Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : (data.category ? [data.category] : []);
	const primaryCategory = data.category || categories[0] || null;
	return Book.create({ ...data, category: primaryCategory, categories, sellerId: user.userID });
}
function updateBook(id, data, user) { const filter = user.role === 'admin' ? { _id: id } : { _id: id, sellerId: user.userID }; return Book.findOneAndUpdate(filter, data, { new: true, runValidators: true }); }
function deleteBook(id, user) { const filter = user.role === 'admin' ? { _id: id } : { _id: id, sellerId: user.userID }; return Book.findOneAndDelete(filter); }

module.exports = { listBooks, getBook, createBook, updateBook, deleteBook };