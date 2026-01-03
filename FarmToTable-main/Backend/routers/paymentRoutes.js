const express = require("express");
const { createOrder, verifyPayment } = require("../controller/paymentController");
const { authMiddleware } = require('../middleware/authMiddleware.js');

const router = express.Router();

// These paths must match the ones in your frontend api.post calls
router.post("/razorpay-order", authMiddleware, createOrder);
router.post("/razorpay-verify", authMiddleware, verifyPayment);

module.exports = router;