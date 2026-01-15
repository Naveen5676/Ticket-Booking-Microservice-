require("dotenv").config();

const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI;


const connectDB = async () =>{
    try{
        await mongoose.connect(mongoUri)
        console.log("Event Service connected to MongoDB");
        
    }catch(error){
        console.log("Event service Failed to connect to MongoDB:", error);
        throw new error
    }
}


module.exports = {connectDB}