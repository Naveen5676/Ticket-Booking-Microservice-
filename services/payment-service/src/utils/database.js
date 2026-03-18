require("dotenv").config();

const mongoose = require("mongoose");

const MongoUrl = process.env.MONGODB_URI;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MongoUrl);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    throw error;
  }
};

module.exports = { connectToDatabase };
