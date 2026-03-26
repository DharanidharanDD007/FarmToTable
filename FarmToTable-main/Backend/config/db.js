const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try{
    const mongoUrl = process.env.MONGODB_URL;
    console.log("🔗 Attempting to connect to MongoDB...",mongoUrl);
    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB connected....");
  }catch(error){
    console.error("❌ Error connecting to MongoDB!", error);
  }
};
module.exports = connectDB;