require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const connectDatabase = require('../src/config/db');

async function seedMaster() {
  await connectDatabase();
  console.log('✅ Connected to MongoDB Atlas.');

  // Find admin/seller user to assign as sellerId
  let seller = await User.findOne({ role: { $in: ['admin', 'seller'] } });
  if (!seller) {
    seller = await User.findOne({});
  }
  const sellerId = seller ? String(seller._id) : 'system-seller';

  // Read verifiedBooksCatalog.json
  const catalogPath = path.join(__dirname, 'verifiedBooksCatalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`Catalog file not found at ${catalogPath}! Run buildVerifiedCatalog.js first.`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const categories = await Category.find({});
  const categoryMap = {};
  categories.forEach(c => {
    categoryMap[c.name] = c._id;
  });

  const booksToInsert = [];
  const report = {};

  for (const [catName, books] of Object.entries(catalog)) {
    const catId = categoryMap[catName];
    if (!catId) {
      console.warn(`⚠️ Category not found in DB: "${catName}"`);
      continue;
    }

    report[catName] = 0;
    for (const b of books) {
      booksToInsert.push({
        ...b,
        category: catId,
        categories: [catId],
        sellerId,
        status: 'active',
        available: true,
        featured: (b.sold || 0) > 300
      });
      report[catName]++;
    }
  }

  console.log(`\nReady to insert ${booksToInsert.length} verified books across ${Object.keys(report).length} categories.`);
  console.log('Clearing old books...');
  await Book.deleteMany({});

  console.log('Inserting into database...');
  await Book.insertMany(booksToInsert);

  console.log('\n============================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  console.log('📊 SỐ LƯỢNG SÁCH PHÂN BỔ ĐỒNG ĐỀU CHO TỪNG THỂ LOẠI:');
  console.log('------------------------------------------------------------');
  for (const [catName, count] of Object.entries(report)) {
    console.log(`- ${catName.padEnd(35)}: ${count} cuốn`);
  }
  console.log('------------------------------------------------------------');
  console.log(`TỔNG CỘNG: ${booksToInsert.length} CUỐN SÁCH`);
  console.log('============================================================\n');

  process.exit(0);
}

seedMaster().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
