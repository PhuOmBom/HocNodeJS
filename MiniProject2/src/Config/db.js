const mongoose = require('mongoose');

async function connectDatabase() {
    const uri = process.env.MONGODB_URI || 'mongodb://lenhatquangldb_db_user:X2ezQ3VJEpDkEDYB@ac-bkgrleg-shard-00-00.ssg10ou.mongodb.net:27017,ac-bkgrleg-shard-00-01.ssg10ou.mongodb.net:27017,ac-bkgrleg-shard-00-02.ssg10ou.mongodb.net:27017/bookstore?ssl=true&replicaSet=atlas-337o22-shard-0&authSource=admin&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('Connected to {MONGODB_URI}');
};

module.exports = connectDatabase;
