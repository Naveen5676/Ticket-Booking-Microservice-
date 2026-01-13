const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(String(MONGODB_URI));
    console.log("User Service connected to MongoDB");
  } catch (error) {
    console.error("User Service Failed to connect to MongoDB:", error);
    throw new error
  }
};

module.exports = { connectToDatabase };
