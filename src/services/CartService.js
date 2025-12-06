/* src/services/CartService.js — UPDATED (small improvements)
Changes:

* Endpoint paths kept but returns consistent object access (items || []).
* Standardized function signatures and added minor defensive returns.
  */

import api from "../api/axios";

export const CartService = {
// Get user cart
getCart: async (userId) => {
const response = await api.get(`/cart/get/${userId}`);
return response.data || { items: [], totalAmount: 0 };
},

// Add item to cart
addToCart: async (userId, productId, quantity) => {
const response = await api.post("/cart/add", { userId, productId, quantity });
return response.data || { items: [], totalAmount: 0 };
},

// Update item quantity
updateQuantity: async (userId, productId, quantity) => {
const response = await api.put("/cart/update", { userId, productId, quantity });
return response.data || { items: [], totalAmount: 0 };
},

// Remove item from cart
removeFromCart: async (userId, productId) => {
const response = await api.delete("/cart/remove", { data: { userId, productId } });
return response.data || { items: [], totalAmount: 0 };
},

// Clear cart
clearCart: async (userId) => {
const response = await api.delete("/cart/clear", { data: { userId } });
return response.data || { items: [], totalAmount: 0 };
},
};

export default CartService;
