const Category = require('../models/Category');
const Book = require('../models/Book');

function listCategories() { return Category.find({ status: 'active' }).sort({ name: 1 }); }
function createCategory(data) { return Category.create(data); }
function updateCategory(id, data) { return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
function deleteCategory(id) { return Category.findByIdAndUpdate(id, { status: 'inactive' }, { new: true }); }

async function getTopSellingCategories(limit = 3) {
  try {
    const topCategories = await Book.aggregate([
      { $match: { status: 'active', category: { $ne: null } } },
      { $group: { _id: '$category', totalSold: { $sum: '$sold' }, bookCount: { $sum: 1 } } },
      { $sort: { totalSold: -1, bookCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.status': 'active' } },
      {
        $project: {
          _id: '$category._id',
          name: '$category.name',
          description: '$category.description',
          image: '$category.image',
          totalSold: 1,
          bookCount: 1
        }
      }
    ]);

    if (topCategories.length < limit) {
      const existingIds = topCategories.map((c) => c._id);
      const fallbacks = await Category.find({ _id: { $nin: existingIds }, status: 'active' }).limit(limit - topCategories.length);
      for (const cat of fallbacks) {
        const bookCount = await Book.countDocuments({ category: cat._id, status: 'active' });
        topCategories.push({
          _id: cat._id,
          name: cat.name,
          description: cat.description,
          image: cat.image,
          totalSold: 0,
          bookCount
        });
      }
    }

    return topCategories.slice(0, limit);
  } catch (error) {
    const fallbacks = await Category.find({ status: 'active' }).limit(limit);
    return fallbacks.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      description: cat.description,
      totalSold: 0,
      bookCount: 0
    }));
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, getTopSellingCategories };