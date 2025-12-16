const { Cashfree } = require("cashfree-pg");
const Order = require("../model/Order");
const Product = require("../model/Product");
const Cart = require("../model/Carts");
const dotenv = require("dotenv");
dotenv.config();

// Cashfree config is now handled per-request in the controller methods (v5.x pattern)

// Helper: Calculate total secure price & validate stock
const calculateServerTotal = async (cartItems) => {
    const productIds = cartItems.map((item) => item.productId || item.id || item._id);
    const products = await Product.find({ _id: { $in: productIds } });

    let total = 0;
    const verifiedItems = [];

    for (const cartItem of cartItems) {
        const product = products.find(
            (p) => p._id.toString() === (cartItem.productId || cartItem.id || cartItem._id)
        );

        if (!product) throw new Error(`Product not found: ${cartItem.name}`);

        if (product.stock < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        total += product.price * cartItem.quantity;

        verifiedItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            unit: product.unit,
            image: product.image,
            farmerId: product.farmerId,
            farmerName: product.farmerName
        });
    }

    return { total, verifiedItems };
};

// 1. Create Order
const createOrder = async (req, res) => {
    try {
        const { cartItems, customerId, customerPhone, customerName, customerEmail } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        const { total } = await calculateServerTotal(cartItems);

        const request = {
            order_amount: total,
            order_currency: "INR",
            order_id: `order_${Date.now()}`,
            customer_details: {
                customer_id: customerId || "guest_" + Date.now(),
                customer_phone: customerPhone || "9999999999",
                customer_name: customerName || "Customer",
                customer_email: customerEmail || "customer@example.com"
            },
            order_meta: {
                return_url: "https://example.com/return?order_id={order_id}"
            }
        };

        // Initialize Cashfree Instance
        const cashfree = new Cashfree({
            xClientId: process.env.CASHFREE_APP_ID,
            xClientSecret: process.env.CASHFREE_SECRET_KEY,
            xEnvironment: Cashfree.Environment[process.env.CASHFREE_ENV || "SANDBOX"]
        });

        // Use appropriate method (try PGCreateOrder, fallback if needed)
        // v5.x typically uses instance methods matching the API
        const response = await cashfree.PGCreateOrder("2023-08-01", request);

        res.json({ ...response.data, environment: process.env.CASHFREE_ENV || "SANDBOX" });

    } catch (error) {
        console.error("Cashfree Create Order Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message || "Payment initialization failed" });
    }
};

// 2. Verify & Save Order
const verifyPayment = async (req, res) => {
    try {
        const { orderId, cartItems } = req.body;

        const userId = req.user.id || req.user._id;
        const userName = req.user.name;

        // Initialize Cashfree Instance
        const cashfree = new Cashfree({
            xClientId: process.env.CASHFREE_APP_ID,
            xClientSecret: process.env.CASHFREE_SECRET_KEY,
            xEnvironment: Cashfree.Environment[process.env.CASHFREE_ENV || "SANDBOX"]
        });

        // Call Cashfree API to verify order status
        const response = await cashfree.PGOrderFetchPayments("2023-08-01", orderId);

        // Check if any payment is successful
        const validPayment = response.data.find(payment => payment.payment_status === "SUCCESS");

        if (!validPayment) {
            return res.status(400).json({ success: false, message: "Payment not verified" });
        }

        // Recalculate to get verified items
        const { total, verifiedItems } = await calculateServerTotal(cartItems);

        // Save Order
        const newOrder = new Order({
            customerId: userId,
            customerName: userName,
            products: verifiedItems,
            total: total,
            status: "Paid",
            paymentId: validPayment.cf_payment_id,
            orderId: orderId,
        });

        await newOrder.save();

        // Update Stock
        for (const item of verifiedItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        // Clear User Cart
        await Cart.findOneAndDelete({ userId });

        res.json({
            success: true,
            message: "Order placed successfully",
            orderId: newOrder._id
        });

    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ error: error.message || "Payment verification failed" });
    }
};

module.exports = { createOrder, verifyPayment };