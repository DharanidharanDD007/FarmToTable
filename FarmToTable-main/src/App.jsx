import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Import Context

// Components
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
import ProtectedRoute from "./components/ProtectedRoute";


// Services & API
import callGeminiAPI from "./api/gemini";
import * as productApi from "./api/products";
import * as orderApi from "./api/orders";
import * as userApi from "./api/users";
import { CartService } from "./services/CartService";

export default function App() {
  // Global State (User is now in Context)
  const { user, updateProfile: apiUpdateProfile } = useAuth();

  // Data State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState([]); // Kept if needed for farmer lookups
  const [orders, setOrders] = useState([]);

  // UI State
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [cartNotification, setCartNotification] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const allProducts = await productApi.getAllProducts();
      setProducts(allProducts);

      try {
        const allFarmers = await userApi.getFarmers();
        setUsers(Array.isArray(allFarmers) ? allFarmers : []);
      } catch (err) {
        console.error("Failed to load farmers list:", err);
      }

      // Only fetch user-specific data if user is logged in
      if (user) {
        const userId = user._id || user.id;
        const userCart = await CartService.getCart(userId);
        setCart(userCart.items || []);

        if (user.role === "customer") {
          // CRITICAL: Customer must see ALL their orders (all statuses)
          const customerOrders = await orderApi.getCustomerOrders();
          setOrders(Array.isArray(customerOrders) ? customerOrders : []);
        } else if (user.role === "farmer") {
          // Farmers see active orders (will be filtered in FarmerOrdersPage)
          const activeOrders = await orderApi.getFarmerActiveOrders();
          setOrders(Array.isArray(activeOrders) ? activeOrders : []);
        }
      } else {
        // Clear sensitive data on logout
        setCart([]);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Re-fetch data when user changes (login/logout)
  useEffect(() => {
    fetchData();
  }, [user]);

  // --- Handlers ---
  // Note: Auth handlers (login, signup, logout) are removed. 
  // Components should use useAuth() directly.

  const handlers = {
    // Navigation wrapper for legacy components using handlers.navigateTo
    navigateTo: (path) => navigate(path === 'home' ? '/' : `/${path}`),

    goToProducts: () => {
      setSelectedFarmer(null);
      setLocationFilter("all");
      navigate("/");
    },

    addToCart: async (product) => {
      if (!user) {
        alert("Please login to add items to cart");
        navigate("/login");
        return;
      }
      try {
        const userId = user._id || user.id;
        const productId = product._id || product.id;
        console.log("Adding to cart:", { userId, productId, product });
        const updatedCart = await CartService.addToCart(userId, productId, 1);
        setCart(updatedCart.items || []);
        alert("Added to cart successfully!");
      } catch (error) {
        console.error("Add to cart failed", error);
        alert(`Failed to add to cart: ${error.response?.data?.message || error.message}`);
      }
    },

    removeFromCart: async (productId) => {
      try {
        const userId = user._id || user.id;
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
        const userId = user._id || user.id;
        const updatedCart = await CartService.updateQuantity(userId, productId, newQuantity);
        setCart(updatedCart.items || []);
      } catch (error) {
        console.error("Update quantity failed", error);
      }
    },

    generateRecipe: async () => {
      const ingredients = cart
        .map((item) => item.name || item.productName)
        .filter(Boolean)
        .join(", ");
      const prompt = `Suggest a simple, delicious recipe using these ingredients: ${ingredients}. Format:\n**Recipe Name**\n*Ingredients*: ...\n*Steps*: ...`;
      return await callGeminiAPI(prompt, setIsGenerating);
    },

    checkout: () => {
      navigate('/cart');
    },

    saveProduct: async (productData) => {
      if (!user || user.role !== "farmer") {
        alert("Only farmers can save products.");
        return;
      }
      try {
        const image = productData.image || `https://placehold.co/600x400/87CEEB/333?text=${encodeURIComponent(productData.name)}`;
        const payload = { ...productData, image, stock: parseInt(productData.stock, 10) || 0 };

        if (productData.id) {
          await productApi.updateProduct(productData.id, payload);
        } else {
          await productApi.createProduct(payload);
        }

        const prods = await productApi.getAllProducts();
        setProducts(prods);
        alert("Product saved successfully!");
        navigate("/farmerDashboard");
      } catch (error) {
        alert("Failed to save product: " + (error.response?.data?.message || error.message));
      }
    },

    requestDeleteProduct: (productId) => {
      const product = products.find((p) => p._id === productId || p.id === productId);
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

    updateProfile: async (name, email, location, bio) => {
      try {
        const result = await apiUpdateProfile(name, email, location, bio);
        if (result.success) {
          alert("Profile updated successfully!");
        } else {
          alert("Failed to update profile: " + result.message);
        }
      } catch (error) {
        alert("An unexpected error occurred while updating profile.");
      }
    },

    viewFarmer: (farmerId) => {
      // Logic to find farmer and navigate
      const farmer = users.find(u => u._id === farmerId || u.id === farmerId);
      // Note: 'users' state needs to be populated via an API call in fetchData if you want this to work robustly
      if (farmer) {
        const farmerProducts = products.filter((p) => p.farmerId === farmerId);
        setSelectedFarmer({ ...farmer, products: farmerProducts });
        navigate("/farmerProfile");
      } else {
        // Fallback if users list isn't loaded globally
        navigate("/");
      }
    },

    viewFarmerProfile: (farmerId) => handlers.viewFarmer(farmerId),

    getNewOrdersCount: (farmerId) =>
      orders.filter((o) => (o.orderStatus || o.status) === "CONFIRMED" && (o.orderedItems || o.products || []).some((p) => p.farmerId === farmerId)).length,

    updateOrderStatus: async (orderId, newStatus) => {
      try {
        await orderApi.updateOrderStatus(orderId, newStatus);
        // Refresh orders based on user role
        if (user?.role === "customer") {
          const customerOrders = await orderApi.getCustomerOrders();
          setOrders(Array.isArray(customerOrders) ? customerOrders : []);
        } else if (user?.role === "farmer") {
          const activeOrders = await orderApi.getFarmerActiveOrders();
          setOrders(Array.isArray(activeOrders) ? activeOrders : []);
        }
        alert("Order status updated to " + newStatus);
      } catch (error) {
        console.error("Update order status error:", error);
        alert("Failed to update status: " + (error.response?.data?.message || error.message));
      }
    },

    generateDescription: async (productName) => {
      if (!productName) return;
      const prompt = `Write a short, appealing one-sentence description for '${productName}'.`;
      return await callGeminiAPI(prompt);
    },

    refreshOrders: async () => {
      if (user) {
        if (user.role === "customer") {
          const customerOrders = await orderApi.getCustomerOrders();
          setOrders(Array.isArray(customerOrders) ? customerOrders : []);
        } else if (user.role === "farmer") {
          const activeOrders = await orderApi.getFarmerActiveOrders();
          setOrders(Array.isArray(activeOrders) ? activeOrders : []);
        }
      }
    },

    handleLocationFilter: (location) => setLocationFilter(location),

    getFarmerWithProducts: (farmerId) => {
      // Helper for CustomerOrdersPage
      // Ideally this data fetching should happen inside the page, but keeping for compatibility
      const farmer = users.find(u => u._id === farmerId || u.id === farmerId);
      if (!farmer) return null;
      return { ...farmer, products: products.filter(p => p.farmerId === farmerId) };
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans transition-colors duration-300" >
      {/* Header accesses user/logout via Context internally if refactored, or we pass user from Context here */}
      < Header cart={cart} handlers={handlers} user={user} newOrdersCount={user?.role === 'farmer' ? handlers.getNewOrdersCount(user._id || user.id) : 0} />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<ProductsPage products={products} handlers={handlers} locationFilter={locationFilter} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/cart" element={<CartPage user={user} handlers={handlers} />} />

          {/* Protected Customer Routes */}
          <Route path="/customerOrders" element={
            <ProtectedRoute user={user} role="customer">
              <CustomerOrdersPage user={user} orders={orders} handlers={handlers} />
            </ProtectedRoute>
          } />

          {/* Protected General Profile */}
          <Route path="/profile" element={
            <ProtectedRoute user={user}>
              <ProfilePage user={user} handlers={handlers} />
            </ProtectedRoute>
          } />

          {/* Protected Farmer Routes */}
          <Route path="/farmerDashboard" element={
            <ProtectedRoute user={user} role="farmer">
              <FarmerDashboardPage user={user} products={products} handlers={handlers} />
            </ProtectedRoute>
          } />
          <Route path="/farmerOrders" element={
            <ProtectedRoute user={user} role="farmer">
              <FarmerOrdersPage user={user} orders={orders} handlers={handlers} />
            </ProtectedRoute>
          } />

          {/* Dynamic/Modal Routes */}
          <Route path="/farmerProfile" element={
            selectedFarmer ? (
              <FarmerProfilePage farmer={selectedFarmer} products={selectedFarmer.products} handlers={handlers} />
            ) : (
              <ProductsPage products={products} handlers={handlers} locationFilter={locationFilter} />
            )
          } />
        </Routes>
      </main>

      {/* Global Modals */}
      {
        productToDelete && (
          <ConfirmationModal
            productName={productToDelete.name}
            onConfirm={handlers.confirmDeleteProduct}
            onCancel={handlers.cancelDelete}
          />
        )
      }

    </div >
  );
}