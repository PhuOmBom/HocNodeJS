const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB(){
    await client.connect();
    db = client.db(process.env.DATABASE_NAME);
    console.log(`Connected to MongoDB: ${process.env.DATABASE_NAME}`);
}

function getDB(){
    if(!db){
        throw new Error("Database is not connected");
    }

    return db;
}

module.exports = {
    connectDB,
    getDB
};