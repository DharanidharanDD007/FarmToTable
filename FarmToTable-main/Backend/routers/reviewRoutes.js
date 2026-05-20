const express = require("express");
const router = express.Router();
const Review = require("../model/Review");
const { authMiddleware } = require("../middleware/authMiddleware");

// @route   GET /api/reviews/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get("/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Server error while fetching reviews." });
    }
});

// @route   POST /api/reviews
// @desc    Create a product review
// @access  Private (Authenticated users only)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        
        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: "Please provide productId, rating, and comment." });
        }

        const newReview = new Review({
            productId,
            customerId: req.user.id,
            customerName: req.user.name || "Customer",
            rating: Number(rating),
            comment
        });

        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Server error while creating review." });
    }
});

module.exports = router;
