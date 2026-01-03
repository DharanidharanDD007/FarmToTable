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

        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        
        const request = {
            order_amount: total,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: customerId || "guest_" + Date.now(),
                customer_phone: customerPhone || "9999999999",
                customer_name: customerName || "Customer",
                customer_email: customerEmail || "customer@example.com"
            },
            order_meta: {
                return_url: `${frontendUrl}/payment-return?order_id={order_id}`,
                notify_url: `${frontendUrl}/api/payments/webhook` // For webhook if needed
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

        // Handle response - Cashfree v5 returns data in response.data
        const responseData = response.data || response;
        
        if (!responseData.payment_session_id) {
            console.error("Cashfree response missing payment_session_id:", responseData);
            return res.status(500).json({ error: "Failed to create payment session" });
        }

        res.json({ 
            ...responseData, 
            environment: process.env.CASHFREE_ENV || "SANDBOX",
            order_id: request.order_id // Include order_id for verification
        });

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

        // Handle response structure - could be array or object with data property
        const payments = Array.isArray(response.data) ? response.data : 
                        (response.data?.payments || [response.data]).filter(Boolean);

        // Check if any payment is successful
        const validPayment = payments.find(payment => 
            payment.payment_status === "SUCCESS" || 
            payment.payment_status === "PAID" ||
            payment.status === "SUCCESS"
        );

        if (!validPayment) {
            return res.status(400).json({ success: false, message: "Payment not verified" });
        }

        // Recalculate to get verified items
        const { total, verifiedItems } = await calculateServerTotal(cartItems);

        // Extract farmer information from first item (assuming single-farmer orders)
        const primaryFarmer = verifiedItems[0];
        if (!primaryFarmer.farmerId || !primaryFarmer.farmerName) {
            return res.status(400).json({ error: "Farmer information missing in order items" });
        }

        // Generate unique orderId if not provided
        const uniqueOrderId = orderId || `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Save Order with new structure
        // CRITICAL: Order status starts as CONFIRMED (not "Paid")
        // Payment is verified, but order needs farmer acceptance
        const newOrder = new Order({
            orderId: uniqueOrderId,
            customerId: userId,
            customerName: userName,
            farmerId: primaryFarmer.farmerId,
            farmerName: primaryFarmer.farmerName,
            orderedItems: verifiedItems.map(item => ({
                productId: item.productId.toString(),
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                unit: item.unit,
                farmerId: item.farmerId,
                farmerName: item.farmerName,
                image: item.image || null
            })),
            total: total,
            orderStatus: 'CONFIRMED', // Always starts as CONFIRMED after payment
            paymentId: validPayment.cf_payment_id
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