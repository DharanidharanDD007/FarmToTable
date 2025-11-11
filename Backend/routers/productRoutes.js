const express = require('express');
const productController = require("../controller/productController.js");
const router = express.Router();

// Assuming you have an auth middleware for verifying tokens
const { authMiddleware, isFarmer } = require('../middleware/authMiddleware.js'); // Example


router.get("/", productController.getProducts);

router.get("/my-products", authMiddleware, isFarmer, productController.getFarmerProducts);

router.post("/", authMiddleware, isFarmer, productController.createProduct);

router.put("/:id", authMiddleware, isFarmer, productController.updateProduct);

router.delete("/:id", authMiddleware, isFarmer, productController.deleteProduct);

module.exports = router;