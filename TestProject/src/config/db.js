const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');

async function autoSeedCategories() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const { initialCategories } = require('../../scripts/seedCategories');
      await Category.insertMany(initialCategories.map((c) => ({ ...c, status: 'active' })));
      console.log(`Auto-seeded ${initialCategories.length} default categories.`);
    }
  } catch (err) {
    console.warn('Auto-seed categories warning:', err.message);
  }
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookstore';
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${uri}`);
  await autoSeedCategories();
  await User.syncIndexes().catch((err) => console.warn('User syncIndexes warning:', err.message));
}

module.exports = connectDatabase;