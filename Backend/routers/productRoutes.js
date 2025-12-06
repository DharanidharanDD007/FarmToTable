const express = require('express');
const { body } = require('express-validator'); // Crushed if not installed
const productController = require("../controller/productController.js");
const { authMiddleware, isFarmer } = require('../middleware/authMiddleware.js');
const validate = require('../middleware/validate.js'); // Crashed if file missing
const router = express.Router();

// Validation Rules for Products
const productValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    
    body('price')
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
    
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    
    body('unit')
        .trim()
        .notEmpty()
        .withMessage('Unit is required (e.g., kg, bunch)'),
    
    body('image')
        .optional()
        .isURL()
        .withMessage('Image must be a valid URL')
];

// Routes

// Get all products (Public)
router.get("/", productController.getProducts);

// Get farmer's own products (Protected: Farmer only)
router.get("/my-products", authMiddleware, isFarmer, productController.getFarmerProducts);

// Create a new product (Protected: Farmer only + Validation)
router.post("/", 
    authMiddleware, 
    isFarmer, 
    productValidation, 
    validate, 
    productController.createProduct
);

// Update a product (Protected: Farmer only + Validation)
router.put("/:id", 
    authMiddleware, 
    isFarmer, 
    productValidation, 
    validate, 
    productController.updateProduct
);

// Delete a product (Protected: Farmer only)
router.delete("/:id", authMiddleware, isFarmer, productController.deleteProduct);

module.exports = router;