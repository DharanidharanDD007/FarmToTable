const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../model/Order");
const Product = require("../model/Product");
const Cart = require("../model/Carts");

// Initialize inside functions in case environment variables load late
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SA9WQ0C0LdYr9x',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'zY71amH1RALZOwlFoxlNSKOP',
    });
};

// 1. Create Razorpay Order
exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };
        const rzp = getRazorpayInstance();
        const order = await rzp.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        res.status(500).json({ error: error.message || error.description || "Failed to create order" });
    }
};

// 2. Verify Payment and Save Order
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, amount } = req.body;

        // Verify Razorpay signature (CRITICAL for security)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Payment verification failed: Invalid signature." });
        }

        // Fetch fresh product data from the database to ensure all required fields are present
        const verifiedProducts = await Promise.all(cartItems.map(async (item) => {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product not found: ${item.name}`);

            return {
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                unit: product.unit,
                image: product.image,
                farmerId: product.farmerId,
                farmerName: product.farmerName
            };
        }));

        // Generate our internal orderId (Order schema expects unique orderId)
        const internalOrderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const newOrder = new Order({
            orderId: internalOrderId,
            customerId: req.user.id,
            customerName: req.user.name,
            farmerId: verifiedProducts[0].farmerId,
            farmerName: verifiedProducts[0].farmerName,
            orderedItems: verifiedProducts,
            total: amount,
            orderStatus: "CONFIRMED",
            paymentId: razorpay_payment_id
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