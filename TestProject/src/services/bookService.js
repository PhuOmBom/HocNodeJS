const mongoose = require('mongoose');
const Book = require('../models/Book');
const Category = require('../models/Category');

async function listBooks(query = {}) {
	const filter = { status: 'active' };

	// Support multiple genres / categories (comma-separated string or array or single value)
	const rawCats = query.genres || query.categories || query.category;
	if (rawCats) {
		const catList = Array.isArray(rawCats) 
			? rawCats 
			: String(rawCats).split(',').map(s => s.trim()).filter(Boolean);
		
		if (catList.length > 0) {
			const validObjectIds = catList.filter(id => mongoose.Types.ObjectId.isValid(id));
			const names = catList.filter(item => !mongoose.Types.ObjectId.isValid(item));
			
			const queryOr = [];
			if (validObjectIds.length > 0) {
				queryOr.push({ _id: { $in: validObjectIds } });
			}
			if (names.length > 0) {
				queryOr.push({ name: { $in: names.map(n => new RegExp(`^${n}$`, 'i')) } });
			}
			
			let catIds = [];
			if (queryOr.length > 0) {
				const found = await Category.find({ $or: queryOr }).select('_id');
				catIds = found.map(c => c._id);
			}
			
			// Also merge any validObjectIds directly
			const mergedSet = new Set([...catIds.map(String), ...validObjectIds]);
			const finalCatIds = Array.from(mergedSet).map(id => new mongoose.Types.ObjectId(id));
			
			if (finalCatIds.length > 0) {
				filter.$or = [{ category: { $in: finalCatIds } }, { categories: { $in: finalCatIds } }];
			}
		}
	}

	if (query.search) {
		const searchOr = [
			{ title: new RegExp(query.search, 'i') }, 
			{ author: new RegExp(query.search, 'i') }, 
			{ isbn: new RegExp(query.search, 'i') }, 
			{ publisher: new RegExp(query.search, 'i') }
		];
		if (filter.$or) {
			filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
			delete filter.$or;
		} else {
			filter.$or = searchOr;
		}
	}

	if (query.minPrice || query.maxPrice) {
		filter.price = {};
		if (query.minPrice) filter.price.$gte = Number(query.minPrice);
		if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
	}

	const sort = query.sort === 'price_asc' || query.sort === 'price-asc' 
		? { price: 1 } 
		: query.sort === 'price_desc' || query.sort === 'price-desc' 
		? { price: -1 } 
		: query.sort === 'rating' 
		? { rating: -1 } 
		: query.sort === 'newest' 
		? { createdAt: -1 } 
		: { sold: -1, createdAt: -1 };

	return Book.find(filter).populate('category').populate('categories').sort(sort);
}

function getBook(id) { 
	return Book.findById(id).populate('category').populate('categories'); 
}

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

async function updateBook(id, data, user) { 
	const filter = user.role === 'admin' 
		? { _id: id } 
		: { _id: id, sellerId: { $in: [user.userID, String(user._id)] } }; 

	if (data.category && (!data.categories || !data.categories.length)) {
		data.categories = [data.category];
	} else if (data.categories && data.categories.length && !data.category) {
		data.category = data.categories[0];
	}

	return Book.findOneAndUpdate(filter, data, { new: true, runValidators: true }).populate('category'); 
}

async function deleteBook(id, user) { 
	const filter = user.role === 'admin' 
		? { _id: id } 
		: { _id: id, sellerId: { $in: [user.userID, String(user._id)] } }; 
	return Book.findOneAndDelete(filter); 
}

module.exports = { listBooks, getBook, createBook, updateBook, deleteBook };