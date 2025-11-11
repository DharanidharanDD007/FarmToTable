const mongoose=require("mongoose");
const dotenv=require("dotenv");

dotenv.config();

 const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ MongoDB connected....");
  } catch (error) {
    console.error("❌ Error connecting in MongoDB!", error);
    process.exit(1); // stop the server if DB fails
  }
};
module.exports=connectDB;