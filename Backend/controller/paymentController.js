const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../model/Order");
const Product = require("../model/Product"); // ✅ Added Product model import
require("dotenv").config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Helper: Calculate total price securely on the server
 * Fetches products from DB to ensure prices are accurate.
 */
const calculateServerTotal = async (cartItems) => {
    // 1. Extract IDs from cart items
    const productIds = cartItems.map((item) => item.productId || item.id || item._id);
    
    // 2. Fetch fresh product data from DB
    const products = await Product.find({ _id: { $in: productIds } });

    let total = 0;
    const verifiedItems = [];

    // 3. Match cart items with DB products
    for (const cartItem of cartItems) {
        const product = products.find(
            (p) => p._id.toString() === (cartItem.productId || cartItem.id || cartItem._id)
        );

        if (!product) {
            throw new Error(`Product not found: ${cartItem.name}`);
        }

        // Optional: Check stock
        if (product.stock < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        // ✅ SECURITY: Use DB price, NOT frontend price
        const itemTotal = product.price * cartItem.quantity;
        total += itemTotal;

        verifiedItems.push({
            productId: product._id, // Standardize ID
            name: product.name,
            price: product.price,   // Store the verified price
            quantity: cartItem.quantity,
            unit: product.unit,
            image: product.image,
            farmerId: product.farmerId,
            farmerName: product.farmerName
        });
    }

    return { total, verifiedItems };
};

// 1. Create Razorpay Order (SECURE)
const createOrder = async (req, res) => {
    try {
        const { cartItems } = req.body; // ✅ Expect items, not amount

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // ✅ Calculate secure amount on server
        const { total } = await calculateServerTotal(cartItems);

        const options = {
            amount: Math.round(total * 100), // Razorpay expects amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error.message);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
};

// 2. Verify Payment & Save Order (SECURE)
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            cartItems
        } = req.body;

        const userId = req.user.id;
        const userName = req.user.name;

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        // 2. ✅ Recalculate totals to ensure Order record is accurate
        // This prevents a user from paying for X but saving an order for Y
        const { total, verifiedItems } = await calculateServerTotal(cartItems);

        // 3. Save Order to DB
        const newOrder = new Order({
            customerId: userId,
            customerName: userName,
            products: verifiedItems, // Use the verified items list
            total: total,            // Use the verified total
            status: "Paid",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
        });

        await newOrder.save();

        res.json({ 
            success: true, 
            message: "Payment verified and order placed", 
            orderId: newOrder._id 
        });

    } catch (error) {
        console.error("Error verifying payment:", error.message);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

module.exports = { createOrder, verifyPayment };