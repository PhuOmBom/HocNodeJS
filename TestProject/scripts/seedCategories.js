require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const connectDatabase = require('../src/config/db');

const initialCategories = [
  // Fiction & Literature
  { name: 'Fiction & Novels', description: 'Bestselling contemporary novels, historical fiction, and timeless drama' },
  { name: 'Classic Literature', description: 'Masterpieces and enduring literary works from world-renowned authors' },
  { name: 'Mystery & Thriller', description: 'Crime fiction, suspenseful investigations, and psychological thrillers' },
  { name: 'Sci-Fi & Fantasy', description: 'Epic fantasy, futuristic sci-fi, space adventures, and magical realism' },
  { name: 'Romance & Drama', description: 'Heartwarming love stories, emotional journeys, and poetic reads' },
  { name: 'Action & Adventure', description: 'Heroic quests, martial arts, survival sagas, and grand journeys' },

  // Comics, Manga & Graphic Novels
  { name: 'Japanese Manga', description: 'Iconic Shonen, Seinen, Shojo, and popular Japanese serialized manga' },
  { name: 'Light Novels', description: 'Popular Japanese serialized light novels with original character art' },
  { name: 'Korean Manhwa', description: 'Vibrant full-color webtoons, fantasy rebirth, and romance manhwa' },
  { name: 'Comics & Graphic Novels', description: 'Western comics, superhero sagas, and illustrated graphic fiction' },

  // Business, Economics & Skills
  { name: 'Business & Finance', description: 'Personal finance, investing, wealth accumulation, and market economics' },
  { name: 'Entrepreneurship & Management', description: 'Startup roadmaps, business execution, and executive leadership' },
  { name: 'Self-Help & Personal Growth', description: 'Mindset development, daily habits, time mastery, and productivity' },
  { name: 'Marketing & Sales', description: 'Digital marketing, growth strategies, copywriting, and brand storytelling' },
  { name: 'Psychology & Human Behavior', description: 'Cognitive psychology, emotional intelligence, and behavioral science' },

  // Technology & Education
  { name: 'Computer Science & AI', description: 'Software engineering, web development, cloud, and artificial intelligence' },
  { name: 'Science & Technology', description: 'Astrophysics, engineering, natural sciences, and pioneering research' },
  { name: 'History & Philosophy', description: 'World history, civilizations, philosophical thought, and biographies' },
  { name: 'Language Learning & Education', description: 'English grammar, vocabulary builders, linguistics, and test prep' },

  // Lifestyle, Art & Children
  { name: 'Children & Young Adult', description: 'Enchanting picture books, fairy tales, and inspiring YA fiction' },
  { name: 'Health & Wellness', description: 'Longevity, fitness routines, mental wellness, and holistic health' },
  { name: 'Cooking & Culinary', description: 'Gourmet recipes, home baking, mixology, and world gastronomy' },
  { name: 'Art, Design & Photography', description: 'Visual arts, architecture, graphic design, and artistic monographs' },
  { name: 'Mindfulness & Spirituality', description: 'Inner calm, meditation practices, philosophy, and mindful living' }
];

async function seed() {
  try {
    await connectDatabase();
    console.log('Syncing categories to English...');
    
    // Check if categories need migration to English
    const existingCategories = await Category.find();
    const isVietnamese = existingCategories.some(c => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(c.name));

    if (isVietnamese) {
      console.log('Detected Vietnamese categories. Migrating database categories to English...');
      await Category.deleteMany({});
      await Category.insertMany(initialCategories.map(c => ({ ...c, status: 'active' })));
      console.log(`Replaced with ${initialCategories.length} English categories.`);
    } else {
      let added = 0;
      for (const item of initialCategories) {
        const found = await Category.findOne({ name: item.name });
        if (!found) {
          await Category.create({ ...item, status: 'active' });
          added++;
        }
      }
      console.log(`Synced categories. Added: ${added}, Total: ${await Category.countDocuments()}`);
    }

    // Attach any orphaned books to the first category if needed
    const firstCat = await Category.findOne({ status: 'active' });
    if (firstCat) {
      await Book.updateMany({ category: { $in: [null, undefined] } }, { category: firstCat._id });
    }
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, initialCategories };
