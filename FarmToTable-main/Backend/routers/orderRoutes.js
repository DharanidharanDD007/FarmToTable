const express = require('express');
const orderController = require("../controller/orderController.js");
const { authMiddleware, isFarmer } = require('../middleware/authMiddleware.js');

const router = express.Router();

/**
 * ============================================
 * ORDER ROUTES - STRICT VISIBILITY RULES
 * ============================================
 * 
 * CRITICAL RULES:
 * 1. Orders are NEVER deleted
 * 2. Customers ALWAYS see ALL their orders
 * 3. Farmers see orders based on status
 * 4. Status lifecycle: CONFIRMED → ACCEPTED → SHIPPED → DELIVERED
 */

// ===== CUSTOMER ROUTES =====
// Get ALL customer orders (complete history - all statuses)
// Rule: Customer must see ALL orders regardless of status
router.get("/customer/my-orders", authMiddleware, orderController.getCustomerOrders);

// Custom route for customers to confirm they received the order
router.put("/:id/customer-receive", authMiddleware, orderController.customerReceiveOrder);

// ===== FARMER ROUTES =====
// Get farmer's ACTIVE orders (CONFIRMED, ACCEPTED, SHIPPED)
router.get("/farmer/active", authMiddleware, isFarmer, orderController.getFarmerActiveOrders);

// Get farmer's ORDER HISTORY (DELIVERED orders)
router.get("/farmer/history", authMiddleware, isFarmer, orderController.getFarmerOrderHistory);

// Get ALL farmer orders (both active and history)
router.get("/farmer/all", authMiddleware, isFarmer, orderController.getFarmerAllOrders);

// ===== COMMON ROUTES =====
// Create new order (customers only)
router.post("/", authMiddleware, orderController.createOrder);

// Get order by ID (with access control)
router.get("/:id", authMiddleware, orderController.getOrderById);

// Update order status (farmers only - status transitions)
router.put("/:id/status", authMiddleware, isFarmer, orderController.updateOrderStatus);

module.exports = router;
