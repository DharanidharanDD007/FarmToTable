const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    // Core required fields
    orderId: { type: String, required: true, unique: true }, // Unique order identifier
    customerId: { type: String, required: true }, // Who placed the order
    customerName: { type: String, required: true },
    
    // Farmer information - can be single farmer or multiple (for multi-farmer orders)
    farmerId: { type: String, required: true }, // Primary farmer for this order
    farmerName: { type: String, required: true },
    
    // Ordered items (renamed from products to match requirements)
    orderedItems: [
        {
            productId: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            unit: { type: String, required: true },
            farmerId: { type: String, required: true }, // Individual item's farmer
            farmerName: { type: String, required: true },
            image: String
        }
    ],
    
    // Order status - strict lifecycle: CONFIRMED → ACCEPTED → SHIPPED → DELIVERED
    orderStatus: { 
        type: String, 
        enum: ['CONFIRMED', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'CONFIRMED',
        required: true
    },
    
    // Payment information
    total: { type: Number, required: true },
    paymentId: String,
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date } // Timestamp when order was delivered
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Add indexes for better query performance (orderId already has unique index)
orderSchema.index({ customerId: 1, orderStatus: 1 }); // For customer order filtering
orderSchema.index({ farmerId: 1, orderStatus: 1 }); // For farmer order filtering
orderSchema.index({ orderStatus: 1 }); // For filtering by status
orderSchema.index({ createdAt: -1 }); // For sorting by date (descending)
orderSchema.index({ "orderedItems.farmerId": 1 }); // For multi-farmer order queries

// Pre-save hook to update updatedAt timestamp
orderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    if (this.orderStatus === 'DELIVERED' && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
    next();
});

// Pre-update hook to update updatedAt and deliveredAt
orderSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
    this.set({ updatedAt: new Date() });
    if (this.getUpdate()?.orderStatus === 'DELIVERED') {
        this.set({ deliveredAt: new Date() });
    }
    next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
