const Product = require("../model/Product.js");
const redis = require("../config/redis.js");

// Cache key for products list
const CACHE_KEY = "products:all";

// Helper to clear products cache on modifications
const clearProductCache = async () => {
    if (redis) {
        try {
            await redis.del(CACHE_KEY);
            console.log("🧹 Cleared products cache due to modification");
        } catch (err) {
            console.error("Failed to clear products cache:", err.message);
        }
    }
};

// Get all products (with Redis caching)
const getProducts = async (req, res) => {
    try {
        if (redis) {
            try {
                const cachedProducts = await redis.get(CACHE_KEY);
                if (cachedProducts) {
                    console.log("⚡ Serving products list from Upstash Redis Cache");
                    const products = typeof cachedProducts === 'string' ? JSON.parse(cachedProducts) : cachedProducts;
                    return res.status(200).json(products);
                }
            } catch (cacheErr) {
                console.error("Redis cache read error:", cacheErr.message);
            }
        }

        const products = await Product.find();
        
        if (redis) {
            try {
                // Cache for 60 seconds
                await redis.set(CACHE_KEY, JSON.stringify(products), { ex: 60 });
                console.log("💾 Products list cached to Redis");
            } catch (cacheErr) {
                console.error("Redis cache write error:", cacheErr.message);
            }
        }

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

        // Invalidate cache
        await clearProductCache();

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
        
        // Invalidate cache
        await clearProductCache();
        
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
        
        // Invalidate cache
        await clearProductCache();
        
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