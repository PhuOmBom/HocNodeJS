const mongoose = require('mongoose');

async function connectDatabase() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/hr_management';
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDatabase;