const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../model/Order");
require("dotenv").config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Razorpay Order
const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// 2. Verify Payment & Save Order
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            cartItems,
            totalAmount,
        } = req.body;

        // Use authenticated user's ID for security (ignore userId from body)
        const userId = req.user.id;
        const userName = req.user.name;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Payment Verified - Save Order to DB
            const newOrder = new Order({
                customerId: userId,
                customerName: userName,
                products: cartItems.map((item) => ({
                    productId: item.productId || item.id, // Handle both structures
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    farmerId: item.farmerId,
                    farmerName: item.farmerName,
                })),
                total: totalAmount,
                status: "Paid", // Mark as Paid
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
            });

            await newOrder.save();

            res.json({ success: true, message: "Payment verified and order placed", orderId: newOrder._id });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { createOrder, verifyPayment };
