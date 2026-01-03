const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../model/Order");
const Product = require("../model/Product");
const Cart = require("../model/Carts");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Razorpay Order
exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Verify Payment and Save Order
// Backend/controller/paymentController.js
// Backend/controller/paymentController.js

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, amount } = req.body;

        // ... [Keep your existing Signature Verification code here] ...

        // Fetch fresh product data from the database to ensure all required fields are present
        const verifiedProducts = await Promise.all(cartItems.map(async (item) => {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product not found: ${item.name}`);

            return {
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                unit: product.unit,
                image: product.image,
                // These two fields are causing your validation error; fetching them here fixes it
                farmerId: product.farmerId,
                farmerName: product.farmerName
            };
        }));

        const newOrder = new Order({
            customerId: req.user.id,
            customerName: req.user.name,
            orderedItems: verifiedProducts, // Correct field name per Schema
            total: amount,
            status: "Paid",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            // Extract farmer details from the first product (assuming single-farmer order or primary farmer)
            farmerId: verifiedProducts[0].farmerId,
            farmerName: verifiedProducts[0].farmerName
        });

        await newOrder.save();

        // Clear the user's cart after successful order save
        await Cart.findOneAndDelete({ userId: req.user.id });

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
            orderId: newOrder._id
        });
    } catch (error) {
        console.error("Order Save Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};