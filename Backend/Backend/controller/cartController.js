const Cart = require("../model/Carts.js");
const Product = require("../model/Product.js");

// Helper to calculate totals
const calculateTotals = (cart) => {
  if (!cart) return { items: [], totalAmount: 0 };
  let totalAmount = 0;
  const items = cart.items.map(item => {
    const subtotal = item.price * item.quantity;
    totalAmount += subtotal;
    return { ...item.toObject(), subtotal };
  });
  return { ...cart.toObject(), items, totalAmount };
};

// Get cart for a user
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    // Verify user can only access their own cart
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. You can only access your own cart." });
    }
    const cart = await Cart.findOne({ userId });
    res.status(200).json(calculateTotals(cart));
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Use authenticated user's ID for security

    // Only customers can add to cart
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can add items to cart." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check stock availability
    const requestedQuantity = quantity || 1;
    if (product.stock < requestedQuantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stock} ${product.unit} available.` 
      });
    }

    const item = {
      productId,
      name: product.name,
      price: product.price,
      quantity: requestedQuantity,
      image: product.image,
      unit: product.unit,
      farmerId: product.farmerId,
      farmerName: product.farmerName
    };

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [item] });
    } else {
      const existing = cart.items.find(i => i.productId === productId);
      if (existing) {
        const newQuantity = existing.quantity + requestedQuantity;
        // Check if total quantity exceeds stock
        if (product.stock < newQuantity) {
          return res.status(400).json({ 
            message: `Cannot add more. Only ${product.stock} ${product.unit} available.` 
          });
        }
        existing.quantity = newQuantity;
      } else {
        cart.items.push(item);
      }
    }

    await cart.save();
    res.status(200).json(calculateTotals(cart));
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update cart item quantity
const updateCartQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Use authenticated user's ID

    // Only customers can update cart
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can update cart." });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(i => i.productId === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    // Validate stock if quantity is being increased
    if (quantity > item.quantity) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      
      if (product.stock < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${product.stock} ${product.unit} available.` 
        });
      }
    }

    item.quantity = quantity;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    }

    await cart.save();
    res.status(200).json(calculateTotals(cart));
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id; // Use authenticated user's ID

    // Only customers can remove from cart
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can remove items from cart." });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );

    res.status(200).json(calculateTotals(cart));
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated user's ID

    // Only customers can clear cart
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can clear cart." });
    }

    await Cart.findOneAndDelete({ userId });
    res.status(200).json({ message: "Cart cleared", items: [], totalAmount: 0 });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getCart, addToCart, updateCartQuantity, removeFromCart, clearCart };