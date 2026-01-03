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

// Get cart for a user (With Auto-Cleanup of Stale Items)
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user._id || req.user.id;

    if (requesterId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied." });
    }

    let cart = await Cart.findOne({ userId });
    
    if (cart && cart.items.length > 0) {
      // 1. Extract all product IDs from the cart
      const productIds = cart.items.map(item => item.productId);

      // 2. Find which of these IDs actually exist in the Product database
      const validProducts = await Product.find({ _id: { $in: productIds } }).select('_id price name image stock');
      const validProductIds = new Set(validProducts.map(p => p._id.toString()));

      // 3. Filter out items that no longer exist
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => validProductIds.has(item.productId));

      // 4. Update prices/details if they changed (Optional but good for data integrity)
      cart.items.forEach(item => {
        const freshProduct = validProducts.find(p => p._id.toString() === item.productId);
        if (freshProduct) {
            item.price = freshProduct.price;
            item.name = freshProduct.name;
            item.image = freshProduct.image;
        }
      });

      // 5. Save only if we removed items or updated
      if (cart.items.length !== originalLength || validProducts.length > 0) {
        await cart.save();
      }
    }

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
    const userId = req.user._id || req.user.id;

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can add items to cart." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const requestedQuantity = quantity || 1;
    if (product.stock < requestedQuantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stock} ${product.unit} available.` 
      });
    }

    const item = {
      productId: product._id.toString(), // Ensure ID is string
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
    const userId = req.user._id || req.user.id;

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can update cart." });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(i => i.productId === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    if (quantity > item.quantity) {
      const product = await Product.findById(productId);
      if (!product) {
         // Auto-remove if product deleted
         cart.items = cart.items.filter(i => i.productId !== productId);
         await cart.save();
         return res.status(404).json({ message: "Product no longer available" });
      }
      
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
    const userId = req.user._id || req.user.id;

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can remove items." });
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
    const userId = req.user._id || req.user.id;

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