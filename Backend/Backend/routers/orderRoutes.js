const express = require('express');
const ordercontroller = require("../controller/orderController.js");
const { authMiddleware, isFarmer } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Get all orders - requires authentication (farmers can see all, customers see their own)
router.get("/", authMiddleware, ordercontroller.getOrders);
// Create order - requires authentication
router.post("/", authMiddleware, ordercontroller.addOrder);
// Get user orders - requires authentication and ownership verification
router.get("/:userId", authMiddleware, ordercontroller.getUserOrders);
// Get farmer orders - requires authentication and farmer role
router.get("/farmer/:farmerId", authMiddleware, isFarmer, ordercontroller.getFarmerOrders);
// Update order status - requires authentication and farmer role
router.put("/:id/status", authMiddleware, isFarmer, ordercontroller.updateOrderStatus);

module.exports = router;
