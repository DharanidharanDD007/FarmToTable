const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  const mongoUrl = process.env.MONGODB_URL;
  console.log("🔗 Attempting to connect to MongoDB...", mongoUrl);
  
  try {
    // Try primary MONGODB_URL with a 5 second timeout
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB connected to primary database successfully!");
    return;
  } catch (error) {
    console.error("❌ Failed to connect to primary MongoDB:", error.message);
    
    // Fallback 1: Local MongoDB
    const localUrl = "mongodb://127.0.0.1:27017/FormToTable";
    console.log(`🔄 Falling back to local MongoDB: ${localUrl}`);
    try {
      await mongoose.connect(localUrl, {
        serverSelectionTimeoutMS: 3000
      });
      console.log("✅ Connected to local MongoDB fallback!");
      return;
    } catch (localError) {
      console.error("❌ Failed to connect to local MongoDB:", localError.message);
      
      // Fallback 2: In-Memory MongoDB Server
      console.log("🔄 Starting in-memory MongoDB server...");
      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        console.log(`🔗 In-memory MongoDB Server URI: ${uri}`);
        await mongoose.connect(uri);
        console.log("✅ MongoDB connected to in-memory database!");
      } catch (memError) {
        console.error("❌ Failed to start and connect to in-memory MongoDB:", memError.message);
      }
    }
  }
};

module.exports = connectDB;