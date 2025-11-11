const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken'); // 👈 Right here

// Routes
const notesRoutes = require("./routers/notesRoutes.js");
const cartRoutes = require("./routers/cartRoutes.js"); // <-- make sure you create this
const orderRoutes=require("./routers/orderRoutes.js");
const productRoutes=require("./routers/productRoutes.js");
const userRoutes=require("./routers/userRoutes.js");
// DB connection
const connectDB = require("./config/db.js");

// Config
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();
// Routes
// app.use("/api/notes", notesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
