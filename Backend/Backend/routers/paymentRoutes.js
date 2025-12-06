const express = require("express");
const { createOrder, verifyPayment } = require("../controller/paymentController");
const { authMiddleware } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Payment routes require authentication
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);

module.exports = router;
