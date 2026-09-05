const Category = require('../models/Category');

function listCategories() { return Category.find({ status: 'active' }).sort({ name: 1 }); }
function createCategory(data) { return Category.create(data); }
function updateCategory(id, data) { return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
function deleteCategory(id) { return Category.findByIdAndUpdate(id, { status: 'inactive' }, { new: true }); }

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };