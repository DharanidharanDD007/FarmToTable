const Order = require("../model/Order.js");

// Get all orders
const getOrders = async (req, res) => {
    try {
        // Customers can only see their own orders, farmers/admins can see all
        let orders;
        if (req.user.role === 'customer') {
            orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
        } else {
            // Farmers and admins can see all orders
            orders = await Order.find().sort({ createdAt: -1 });
        }
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add order
const addOrder = async (req, res) => {
    try {
        // Only customers can create orders
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: "Only customers can create orders." });
        }

        // Ensure the order belongs to the authenticated user
        const orderData = {
            ...req.body,
            customerId: req.user.id, // Override with authenticated user's ID
            customerName: req.user.name || req.body.customerName
        };

        const newOrder = await Order.create(orderData);
        res.status(201).json(newOrder);
    } catch (err) {
        console.error("Order creation error:", err);
        res.status(500).json({ message: err.message });
    }
};
const getFarmerOrders = async (req, res) => {
    try {
        const { farmerId } = req.params;
        
        // Verify the farmer can only see their own orders
        if (req.user.id !== farmerId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. You can only view your own orders." });
        }

        const orders = await Order.find({ "products.farmerId": farmerId })
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        console.error("Error fetching farmer orders:", err);
        res.status(500).json({ message: err.message });
    }
};
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verify user can only access their own orders
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. You can only view your own orders." });
        }

        const orders = await Order.find({ customerId: userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).json({ message: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status value
        const validStatuses = ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Paid'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify farmer can only update orders containing their products
        if (req.user.role === 'farmer') {
            const hasFarmerProducts = order.products.some(p => p.farmerId === req.user.id);
            if (!hasFarmerProducts) {
                return res.status(403).json({ message: "Access denied. You can only update orders containing your products." });
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        res.status(200).json(updatedOrder);
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getOrders, addOrder, getFarmerOrders, getUserOrders, updateOrderStatus };