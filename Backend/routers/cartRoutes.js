const express = require('express');
const cartcontroller = require("../controller/cartController.js");
const { authMiddleware } = require('../middleware/authMiddleware.js');

const router = express.Router();

// All cart routes require authentication
router.get("/get/:userId", authMiddleware, cartcontroller.getCart);
router.post("/add", authMiddleware, cartcontroller.addToCart);
router.put("/update", authMiddleware, cartcontroller.updateCartQuantity);
router.delete("/remove", authMiddleware, cartcontroller.removeFromCart);
router.delete("/clear", authMiddleware, cartcontroller.clearCart);

module.exports = router;
