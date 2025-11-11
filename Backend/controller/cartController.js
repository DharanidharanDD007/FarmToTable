const Cart =require("../model/Carts.js");
const Product=require( "../model/Product.js");

// Get cart for a user
 const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });
    res.status(200).json(cart || { items: [] });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add item to cart
 const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const item = {
      productId,
      name: product.name,
      price: product.price,
      quantity: quantity || 1,
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
        existing.quantity += quantity || 1;
      } else {
        cart.items.push(item);
      }
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update cart item quantity
 const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(i => i.productId === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = quantity;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove item from cart
 const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports={getCart,addToCart,updateCartQuantity,removeFromCart};