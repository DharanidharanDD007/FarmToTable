const Order =require( "../model/Order.js");

// Get all orders
 const getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add order
 const addOrder = async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
 const getFarmerOrders = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const orders = await Order.find({ "products.farmerId": farmerId })
                                  .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        console.error("Error fetching farmer orders:", err);
        res.status(500).json({ message: err.message });
    }
};
module.exports={getOrders,addOrder,getFarmerOrders};