const Product = require("../model/Product.js");

// Get all products (No change needed)
const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all products for a specific farmer
const getFarmerProducts = async (req, res) => {
    try {
        // Use the authenticated farmer's ID from middleware, not params
        const farmerId = req.user.id; 
        const products = await Product.find({ farmerId });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        // Get farmer details from the authenticated user (req.user)
        const { id, name, location } = req.user; // Assuming these are in the token payload

        const newProduct = await Product.create({
            ...req.body,
            farmerId: id, // Set farmerId from the authenticated user
            farmerName: name, // Set farmerName from the authenticated user
            farmerLocation: location,
        });

        // Return ONLY the new product with a 201 status code
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update an existing product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params; // Get product ID from URL params
        const farmerId = req.user.id; // Get farmer ID from authenticated user

        // First, find the product to make sure it exists and belongs to this farmer
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (product.farmerId.toString() !== farmerId) {
            return res.status(403).json({ message: "Forbidden: You do not own this product." });
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const farmerId = req.user.id;

        // Verify ownership before deleting
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (product.farmerId.toString() !== farmerId) {
            return res.status(403).json({ message: "Forbidden: You cannot delete this product." });
        }
        
        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: "Product deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { 
    getProducts, 
    getFarmerProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct 
};