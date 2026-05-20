const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cluster = require("cluster");
const os = require("os");

// Config - Load env vars FIRST
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Routes
const cartRoutes = require("./routers/cartRoutes.js");
const orderRoutes = require("./routers/orderRoutes.js");
const productRoutes = require("./routers/productRoutes.js");
const userRoutes = require("./routers/userRoutes.js");
const paymentRoutes = require("./routers/paymentRoutes.js");
const reviewRoutes = require("./routers/reviewRoutes.js");
const aiRoutes = require("./routers/aiRoutes.js");

// DB connection
const connectDB = require("./config/db.js");

// Initialize app
const app = express();

// Middleware
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.FRONTEND_URL
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// -------------------------------
// API Routes
// -------------------------------
app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// -------------------------------
// -------------------------------
// Start server (with Clustering support)
// -------------------------------
const PORT = process.env.PORT || 5000;

if (process.env.CLUSTER_MODE === "true" && (cluster.isPrimary || cluster.isMaster)) {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Primary process ${process.pid} is running. Forking ${numCPUs} workers for load balancing...`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(`⚠️ Worker process ${worker.process.pid} exited. Forking a replacement worker...`);
    cluster.fork();
  });
} else {
  // Boot worker process - establish DB connection and listen
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Worker process ${process.pid} started. Server listening on PORT: ${PORT}`);
    });
  }).catch((err) => {
    console.error("❌ Worker failed to start because database connection failed:", err.message);
  });
}