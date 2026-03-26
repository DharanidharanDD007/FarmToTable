const Order = require("../model/Order.js");

/**
 * ============================================
 * CUSTOMER ORDER ENDPOINTS
 * ============================================
 * Rule: Customers ALWAYS see ALL their orders (all statuses)
 * Orders are NEVER deleted or hidden from customers
 */

// Get ALL customer orders (complete history - all statuses)
const getCustomerOrders = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        // CRITICAL RULE: Customer must see ALL their orders regardless of status
        // This includes: CONFIRMED, ACCEPTED, SHIPPED, DELIVERED, CANCELLED
        const orders = await Order.find({ customerId: userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders: orders,
            count: orders.length
        });
    } catch (err) {
        console.error("Error fetching customer orders:", err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * ============================================
 * FARMER ORDER ENDPOINTS
 * ============================================
 * Rule: Farmers see orders based on status
 * - Active Orders: CONFIRMED, ACCEPTED, SHIPPED
 * - Order History: DELIVERED
 */

// Get farmer's ACTIVE orders (CONFIRMED, ACCEPTED, SHIPPED)
const getFarmerActiveOrders = async (req, res) => {
    try {
        const farmerId = req.user.id || req.user._id;

        // Verify user is a farmer
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ message: "Access denied. Farmer role required." });
        }

        // CRITICAL RULE: Farmers see orders with status CONFIRMED, ACCEPTED, or SHIPPED
        // These are "active" orders that need farmer action
        const activeOrders = await Order.find({
            farmerId: farmerId,
            orderStatus: { $in: ['CONFIRMED', 'ACCEPTED', 'SHIPPED'] }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders: activeOrders,
            count: activeOrders.length,
            type: 'active'
        });
    } catch (err) {
        console.error("Error fetching farmer active orders:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get farmer's ORDER HISTORY (DELIVERED orders only)
const getFarmerOrderHistory = async (req, res) => {
    try {
        const farmerId = req.user.id || req.user._id;

        // Verify user is a farmer
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ message: "Access denied. Farmer role required." });
        }

        // CRITICAL RULE: Delivered orders go to history, but are NEVER deleted
        const historyOrders = await Order.find({
            farmerId: farmerId,
            orderStatus: 'DELIVERED'
        }).sort({ deliveredAt: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            orders: historyOrders,
            count: historyOrders.length,
            type: 'history'
        });
    } catch (err) {
        console.error("Error fetching farmer order history:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get ALL farmer orders (both active and history) - for complete view
const getFarmerAllOrders = async (req, res) => {
    try {
        const farmerId = req.user.id || req.user._id;

        // Verify user is a farmer
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ message: "Access denied. Farmer role required." });
        }

        // Get all orders for this farmer (never deleted)
        const allOrders = await Order.find({ farmerId: farmerId })
            .sort({ createdAt: -1 });

        // Separate into active and history
        const active = allOrders.filter(o => ['CONFIRMED', 'ACCEPTED', 'SHIPPED'].includes(o.orderStatus));
        const history = allOrders.filter(o => o.orderStatus === 'DELIVERED');

        res.status(200).json({
            success: true,
            active: {
                orders: active,
                count: active.length
            },
            history: {
                orders: history,
                count: history.length
            },
            total: allOrders.length
        });
    } catch (err) {
        console.error("Error fetching all farmer orders:", err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * ============================================
 * ORDER CREATION
 * ============================================
 */
const createOrder = async (req, res) => {
    try {
        // Only customers can create orders
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: "Only customers can create orders." });
        }

        const userId = req.user.id || req.user._id;
        const { orderedItems, total, paymentId } = req.body;

        // Validate required fields
        if (!orderedItems || orderedItems.length === 0) {
            return res.status(400).json({ message: "Ordered items are required." });
        }

        if (!total || total <= 0) {
            return res.status(400).json({ message: "Valid total amount is required." });
        }

        // Extract farmer information from first item (assuming single-farmer orders for simplicity)
        // For multi-farmer orders, you'd need to group by farmerId
        const primaryFarmer = orderedItems[0];
        if (!primaryFarmer.farmerId || !primaryFarmer.farmerName) {
            return res.status(400).json({ message: "Farmer information is required in ordered items." });
        }

        // Generate unique orderId
        const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create order with status CONFIRMED
        const newOrder = await Order.create({
            orderId: orderId,
            customerId: userId,
            customerName: req.user.name,
            farmerId: primaryFarmer.farmerId,
            farmerName: primaryFarmer.farmerName,
            orderedItems: orderedItems,
            total: total,
            orderStatus: 'CONFIRMED', // Always starts as CONFIRMED
            paymentId: paymentId || null
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder
        });
    } catch (err) {
        console.error("Order creation error:", err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * ============================================
 * ORDER STATUS UPDATES (Farmer Actions)
 * ============================================
 * Status Lifecycle: CONFIRMED → ACCEPTED → SHIPPED → DELIVERED
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        // Validate status value - strict lifecycle
        const validStatuses = ['CONFIRMED', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Only farmers can update order status
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ message: "Only farmers can update order status." });
        }

        const farmerId = req.user.id || req.user._id;

        // Find the order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify farmer owns this order
        if (String(order.farmerId) !== String(farmerId)) {
            return res.status(403).json({
                message: "Access denied. You can only update your own orders."
            });
        }

        // Validate status transition (prevent invalid transitions)
        const currentStatus = order.orderStatus;
        const validTransitions = {
            'CONFIRMED': ['ACCEPTED', 'CANCELLED'],
            'ACCEPTED': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': ['DELIVERED'],
            'DELIVERED': [], // Final state, no further transitions
            'CANCELLED': [] // Final state
        };

        if (!validTransitions[currentStatus]?.includes(orderStatus)) {
            return res.status(400).json({
                message: `Invalid status transition. Cannot change from ${currentStatus} to ${orderStatus}. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'None'}`
            });
        }

        // Update order status
        const updateData = { orderStatus };
        if (orderStatus === 'DELIVERED') {
            updateData.deliveredAt = new Date();
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: `Order status updated to ${orderStatus}`,
            order: updatedOrder
        });
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * ============================================
 * CUSTOMER STATUS UPDATES
 * ============================================
 */
const customerReceiveOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user.id || req.user._id;

        // Only customers can use this specific endpoint
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: "Only customers can confirm delivery." });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify customer owns this order
        if (String(order.customerId) !== String(customerId)) {
            return res.status(403).json({ message: "Access denied. Not your order." });
        }

        // Customer can only confirm receipt if order is SHIPPED
        if (order.orderStatus !== 'SHIPPED') {
            return res.status(400).json({ 
                message: `Cannot confirm delivery. Order is currently ${order.orderStatus}.` 
            });
        }

        // Update order status
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { 
                orderStatus: 'DELIVERED',
                deliveredAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Delivery confirmed successfully.",
            order: updatedOrder
        });
    } catch (err) {
        console.error("Error confirming delivery:", err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * ============================================
 * GET ORDER BY ID
 * ============================================
 */
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify access: Customer can see their own orders, Farmer can see their own orders
        if (userRole === 'customer' && order.customerId !== userId) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (userRole === 'farmer' && order.farmerId !== userId) {
            return res.status(403).json({ message: "Access denied." });
        }

        res.status(200).json({
            success: true,
            order: order
        });
    } catch (err) {
        console.error("Error fetching order:", err);
        res.status(500).json({ message: err.message });
    }
};

// Export all functions
module.exports = {
    // Customer endpoints
    getCustomerOrders,

    // Farmer endpoints
    getFarmerActiveOrders,
    getFarmerOrderHistory,
    getFarmerAllOrders,

    // Common endpoints
    createOrder,
    updateOrderStatus,
    customerReceiveOrder,
    getOrderById
};