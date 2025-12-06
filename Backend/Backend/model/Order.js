const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    products: [
        {
            id: String,
            name: String,
            price: Number,
            quantity: Number,
            unit: String,
            farmerId: String,
            farmerName: String
        }
    ],
    total: Number,
    status: { type: String, default: "New" }, // Removed enum restriction for flexibility
    paymentId: String,
    orderId: String,
    createdAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
orderSchema.index({ customerId: 1 }); // For fetching user orders
orderSchema.index({ "products.farmerId": 1 }); // For fetching farmer orders
orderSchema.index({ status: 1 }); // For filtering by status
orderSchema.index({ createdAt: -1 }); // For sorting by date (descending)

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
