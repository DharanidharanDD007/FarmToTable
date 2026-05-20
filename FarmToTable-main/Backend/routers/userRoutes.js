// routes/userRoutes.js

const express = require("express");
const userController = require("../controller/userController.js");
const { authMiddleware } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Authentication routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/google-auth", userController.googleAuth);

// Data retrieval routes
router.get("/farmers", userController.getFarmers);
router.get("/customers", userController.getCustomers);

// Profile routes
router.put("/profile", authMiddleware, userController.updateProfile);

module.exports = router;