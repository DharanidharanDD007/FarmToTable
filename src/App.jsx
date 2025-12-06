import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ProductsPage from "./components/ProductsPage";
import CartPage from "./components/CartPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import ProfilePage from "./components/ProfilePage";
import FarmerDashboardPage from "./components/FarmerDashboardPage";
import FarmerOrdersPage from "./components/FarmerOrdersPage";
import CustomerOrdersPage from "./components/CustomerOrdersPage";
import FarmerProfilePage from "./components/FarmerProfilePage";
import ConfirmationModal from "./components/ConfirmationModal";
import PaymentModal from "./components/PaymentModal";
import callGeminiAPI from "./api/gemini";
import * as authApi from "./api/auth";
import * as productApi from "./api/products";
import * as orderApi from "./api/orders";
import { CartService } from "./services/CartService";
import * as userApi from "./api/users";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("home");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cartNotification, setCartNotification] = useState("");
  const [authError, setAuthError] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

// Helper: normalize stored user shapes
const getStoredUser = () => {
const raw = localStorage.getItem("currentUser");
if (!raw) return null;
try {
const parsed = JSON.parse(raw);
// parsed might be { user: {...}, token: '...' } or might be the user object itself
if (parsed && parsed.user) return parsed.user;
return parsed;
} catch (err) {
return null;
}
};

// --- Data Fetching ---
const fetchData = async () => {
  setIsLoading(true);
  try {
    const allProducts = await productApi.getAllProducts(); // now valid
    setProducts(allProducts);

    if (user) {
      const userCart = await CartService.getCart(user.id || user._id);
      setCart(userCart.items || []);

      const userOrders = await orderApi.getUserOrders(user.id || user._id);
      setOrders(Array.isArray(userOrders) ? userOrders : []);
    }
  } catch (error) {
    console.error("Error fetching initial data:", error);
    setAuthError("Failed to load data. Please try again later.");
  } finally {
    setIsLoading(false);
  }
};



useEffect(() => {
fetchData();
}, []); // Run once on mount

// --- Handlers ---
const handlers = {
navigateTo: (view) => {
setAuthError(""); // Clear error on nav
// keep navigateTo for general use, but prefer setCurrentView inside payment-success flow
setCurrentView(view);
},
goToProducts: () => {
setSelectedFarmer(null);
setLocationFilter("all");
setCurrentView("products");
},


signup: async (name, email, password, role, location) => {
  try {
    setAuthError("");
    const farmDetails =
      role === "farmer"
        ? {
            name: `${name}'s Farm`,
            location,
            bio: `A family-run farm.`,
          }
        : undefined;

    await authApi.signup({ name, email, password, role, farmDetails });
    alert("Signup successful! Please log in.");
    handlers.navigateTo("login");
  } catch (error) {
    setAuthError(error.response?.data?.message || "Signup failed");
  }
},

login: async (email, password) => {
  try {
    setAuthError("");
    const data = await authApi.login(email, password);
    // Normalize storage: store { user: data.user, token: data.token } when available
    const storeObj = data && data.user ? data : { user: data };
    localStorage.setItem("currentUser", JSON.stringify(storeObj));
    setUser(storeObj.user || storeObj);

    // Fetch user specific data immediately
    const userObj = storeObj.user || storeObj;
    const userId = userObj.id || userObj._id;
    if (userObj.role === "customer") {
      const cartData = await CartService.getCart(userId);
      setCart(cartData.items || []);
      const userOrders = await orderApi.getUserOrders(userId);
      setOrders(Array.isArray(userOrders) ? userOrders : []);
    } else {
      const allOrders = await orderApi.getOrders();
      setOrders(Array.isArray(allOrders) ? allOrders : []);
    }

    handlers.navigateTo("home");
  } catch (error) {
    setAuthError(error.response?.data?.message || "Login failed");
  }
},

logout: () => {
  localStorage.removeItem("currentUser");
  setUser(null);
  setCart([]);
  setOrders([]);
  handlers.navigateTo("home");
},

addToCart: async (product) => {
  if (!user) {
    alert("Please login to add items to cart");
    handlers.navigateTo("login");
    return;
  }
  try {
    const userId = user.id || user._id;
    const productId = product._id || product.id;
    // Note: userId is sent but backend uses authenticated user's ID for security
    const updatedCart = await CartService.addToCart(userId, productId, 1);
    setCart(updatedCart.items || []);
  } catch (error) {
    console.error("Add to cart failed", error);
  }
},

removeFromCart: async (productId) => {
  try {
    const userId = user.id || user._id;
    // Note: userId is sent but backend uses authenticated user's ID for security
    const updatedCart = await CartService.removeFromCart(userId, productId);
    setCart(updatedCart.items || []);
  } catch (error) {
    console.error("Remove from cart failed", error);
  }
},

updateCartQuantity: async (productId, change) => {
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  const newQuantity = item.quantity + change;
  if (newQuantity < 1) {
    handlers.removeFromCart(productId);
    return;
  }
  try {
    const userId = user.id || user._id;
    // Note: userId is sent but backend uses authenticated user's ID for security
    const updatedCart = await CartService.updateQuantity(userId, productId, newQuantity);
    setCart(updatedCart.items || []);
  } catch (error) {
    console.error("Update quantity failed", error);
  }
},

// CHANGED: generateRecipe uses robust name extraction from cart items (CHANGED)
generateRecipe: async () => {
  const ingredients = cart
    .map((item) => item.name || item.productName || item.product?.name || item.product?.title)
    .filter(Boolean)
    .join(", ");
  const prompt = `Suggest a simple, delicious recipe using these ingredients: ${ingredients}. Format:\n**Recipe Name**\n*Ingredients*: ...\n*Steps*: ...`;
  return await callGeminiAPI(prompt, setIsGenerating);
},

checkout: () => {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }
  setCartNotification(""); // Clear previous notifications
  setIsPaymentModalOpen(true);
},

// CHANGED: handlePaymentSuccess now:
// 1) creates order
// 2) refreshes orders from backend
// 3) clears cart on backend and re-fetches cart
// 4) uses setCurrentView to guarantee re-render to orders
handlePaymentSuccess: async (paymentDetails) => {
  setIsPaymentModalOpen(false);

  if (!user || (!user.id && !user._id)) {
    alert("Error: User not logged in or invalid user data. Please log in again.");
    handlers.navigateTo("login");
    return;
  }

  try {
    const totalAmount = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    const customerId = user.id || user._id;

    const orderData = {
      customerId: customerId,
      customerName: user.name,
      products: cart.map((item) => ({
        id: item.productId || item.id || item._id,
        name: item.name || item.productName || item.product?.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        farmerId: item.farmerId,
        farmerName: item.farmerName,
      })),
      total: totalAmount,
      status: "New",
      paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Dummy Payment ID
      paymentMethod: paymentDetails?.method || "unknown",
    };

    console.log("Sending order data:", orderData);

    const newOrder = await orderApi.createOrder(orderData);

    console.log("Order created successfully:", newOrder);
    alert("Order Placed Successfully! Order ID: " + (newOrder.orderId || newOrder._id || newOrder.id));

    // Clear cart locally immediately for UX
    setCart([]);

    // Clear cart on backend, then re-fetch server cart (robust)
    try {
      await CartService.clearCart(customerId);
      const refreshed = await CartService.getCart(customerId);
      setCart(refreshed.items || []);
    } catch (clearError) {
      console.error("Failed to clear or re-fetch cart on backend:", clearError);
      // We continue — the order is placed; don't block navigation
    }

    // Refresh orders from backend so orders page shows latest
    try {
      const userOrders = await orderApi.getUserOrders(customerId);
      setOrders(Array.isArray(userOrders) ? userOrders : []);
    } catch (fetchError) {
      console.error("Failed to refresh orders:", fetchError);
    }

    // CHANGED: ensure view is explicitly set so renderContent updates to orders
    setCurrentView("customerOrders");
  } catch (error) {
    console.error("Order creation failed:", error);
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    alert(`Payment Failed: Failed to create order. Reason: ${errorMessage}`);
    setCartNotification("Order placement failed. Please try again.");
  }
},

saveProduct: async (productData) => {
  if (!user || user.role !== "farmer") {
    alert("Only farmers can save products.");
    return;
  }
  try {
    // Image handling: if no image, use placeholder
    const image =
      productData.image ||
      `https://placehold.co/600x400/87CEEB/333?text=${encodeURIComponent(productData.name)}`;
    const payload = { ...productData, image, stock: parseInt(productData.stock, 10) || 0 };

    if (productData.id) {
      await productApi.updateProduct(productData.id, payload);
    } else {
      await productApi.createProduct(payload);
    }

    const prods = await productApi.getAllProducts();
    setProducts(prods);
    alert("Product saved successfully!");
    handlers.navigateTo("farmerDashboard");
  } catch (error) {
    alert("Failed to save product: " + (error.response?.data?.message || error.message));
  }
},

requestDeleteProduct: (productId) => {
  const product = products.find((p) => p.id === productId || p._id === productId);
  setProductToDelete(product);
},

confirmDeleteProduct: async () => {
  if (!productToDelete) return;
  try {
    const id = productToDelete._id || productToDelete.id;
    await productApi.deleteProduct(id);
    const prods = await productApi.getAllProducts();
    setProducts(prods);
    setProductToDelete(null);
  } catch (error) {
    alert("Failed to delete product");
  }
},

cancelDelete: () => setProductToDelete(null),

updateProfile: (name, email, location, bio) => {
  alert("Profile update not fully supported by backend yet.");
  const updatedUser = { ...user, name, email };
  if (user.role === "farmer") {
    updatedUser.farmDetails = { ...user.farmDetails, name: `${name}'s Farm`, location, bio };
  }
  setUser(updatedUser);
  // Save normalized object shape { user: ... } to localStorage for consistency
  localStorage.setItem("currentUser", JSON.stringify({ user: updatedUser }));
},

viewFarmer: (farmerId) => {
  if (!farmerId) {
    alert("Farmer id missing");
    return;
  }
  const farmer = users.find((u) => u.id === farmerId || u._id === farmerId);
  if (!farmer) {
    alert("Farmer not found");
    return;
  }
  const farmerProducts = products.filter((p) => p.farmerId === farmerId);
  setSelectedFarmer({ ...farmer, products: farmerProducts });
  setCurrentView("farmerProfile");
},

viewFarmerProfile: (farmerId) => handlers.viewFarmer(farmerId),

getNewOrdersCount: (farmerId) =>
  orders.filter((o) => o.status === "New" && o.products.some((p) => p.farmerId === farmerId)).length,

markOrdersAsViewed: (farmerId) => {
  // Placeholder
},

updateOrderStatus: async (orderId, newStatus) => {
  try {
    await orderApi.updateOrderStatus(orderId, newStatus);
    // Refresh orders
    if (user.role === "farmer") {
      const allOrders = await orderApi.getOrders();
      setOrders(Array.isArray(allOrders) ? allOrders : []);
    }
    alert("Order status updated to " + newStatus);
  } catch (error) {
    console.error("Failed to update status:", error);
    alert("Failed to update status");
  }
},

generateDescription: async (productName) => {
  if (!productName) return;
  const prompt = `Write a short, appealing one-sentence description for '${productName}'.`;
  return await callGeminiAPI(prompt);
},

getFarmerWithProducts: (farmerId) => {
  const farmer = users.find((u) => u.id === farmerId || u._id === farmerId);
  if (!farmer) return null;
  const farmerProducts = products.filter((p) => p.farmerId === farmerId);
  return { ...farmer, products: farmerProducts };
},

handleLocationFilter: (location) => setLocationFilter(location),


};

// --- Render content ---
 const renderContent = () => {
    if (isLoading) return <div className="text-center text-xl">Loading...</div>;
    const props = { products, cart, user, users, orders, handlers, selectedFarmer, locationFilter, cartNotification };

    switch (currentView) {
      case "products":
        return <ProductsPage {...props} />;
      case "cart":
        return <CartPage {...props} />;
      case "login":
        return <LoginPage handlers={handlers} error={authError} />;
      case "signup":
        return <SignupPage handlers={handlers} error={authError} />;
      case "profile":
        return user ? <ProfilePage {...props} /> : <LoginPage {...props} />;
      case "farmerDashboard":
        return user ? <FarmerDashboardPage {...props} /> : <LoginPage {...props} />;
      case "farmerOrders":
        return user ? <FarmerOrdersPage {...props} /> : <LoginPage {...props} />;
      case "customerOrders":
        return user ? <CustomerOrdersPage {...props} /> : <LoginPage {...props} />;
      case "farmerProfile":
        return selectedFarmer ? (
          <FarmerProfilePage farmer={selectedFarmer} products={selectedFarmer.products} handlers={handlers} />
        ) : (
          <ProductsPage {...props} />
        );
      default:
        return <ProductsPage {...props} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header
        user={user}
        cart={cart}
        handlers={handlers}
        newOrdersCount={user?.role === "farmer" ? handlers.getNewOrdersCount(user.id || user._id) : 0}
      />
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>

      {productToDelete && (
        <ConfirmationModal
          productName={productToDelete.name}
          onConfirm={handlers.confirmDeleteProduct}
          onCancel={handlers.cancelDelete}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          totalAmount={cart.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2)}
          onConfirm={handlers.handlePaymentSuccess}
          onCancel={() => setIsPaymentModalOpen(false)}
        />
      )}
    </div>
  );
}