const mongoose=require("mongoose");

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
    status: { type: String, enum: ["New","Processing","Completed"], default: "New" },
    createdAt: { type: Date, default: Date.now }
});

const Order= mongoose.model("Order", orderSchema);
module.exports=Order;
