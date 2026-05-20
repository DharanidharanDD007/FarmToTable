const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
}, { timestamps: true });

// Add index for fast retrieval of reviews for a product
reviewSchema.index({ productId: 1 });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
