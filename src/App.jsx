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
import callGeminiAPI from "./api/gemini";
import axios from "axios";

export default function App() {
  const [products, setProducts] = useState(() =>
    JSON.parse(localStorage.getItem("products") || "[]")
  );
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState(() =>
    JSON.parse(localStorage.getItem("users") || "[]")
  );
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser") || "null")
  );
  const [orders, setOrders] = useState(() =>
    JSON.parse(localStorage.getItem("orders") || "[]")
  );

  const [currentView, setCurrentView] = useState(
    user ? (user.role === "farmer" ? "farmerDashboard" : "products") : "products"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const persistProducts = (p) => {
    setProducts(p);
    localStorage.setItem("products", JSON.stringify(p));
  };
  const persistUsers = (u) => {
    setUsers(u);
    localStorage.setItem("users", JSON.stringify(u));
  };
  const persistOrders = (o) => {
    setOrders(o);
    localStorage.setItem("orders", JSON.stringify(o));
  };

  // --- Handlers ---
  const handlers = {
    navigateTo: (view) => setCurrentView(view),
    goToProducts: () => {
      setSelectedFarmer(null);
      setLocationFilter("all");
      setCurrentView("products");
    },

    signup: (name, email, password, role, location) => {
      if (!name || !email || !password || (role === "farmer" && !location)) {
        alert("Please fill all required fields.");
        return;
      }
      if (users.find((u) => u.email === email)) {
        alert("An account with this email already exists.");
        return;
      }
      const newUser = { id: `user-${Date.now()}`, name, email, password, role };
      if (role === "farmer") {
        newUser.farmDetails = {
          name: `${name}'s Farm`,
          location,
          bio: `A family-run farm.`,
        };
      }
      const updated = [...users, newUser];
      persistUsers(updated);
      alert("Signup successful! Please log in.");
      handlers.navigateTo("login");
    },

    login: (email, password) => {
      const foundUser = users.find((u) => u.email === email && u.password === password);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        handlers.navigateTo(foundUser.role === "farmer" ? "farmerDashboard" : "products");
      } else {
        alert("Invalid email or password.");
      }
    },

    logout: () => {
      setUser(null);
      setCart([]);
      localStorage.removeItem("currentUser");
      handlers.goToProducts();
    },

    addToCart: (product) => {
      if (!user || user.role !== "customer") {
        alert("Please log in as a customer to add items.");
        handlers.navigateTo("login");
        return;
      }
      const itemInCart = cart.find((i) => i.id === product.id);
      const currentQty = itemInCart ? itemInCart.quantity : 0;
      if (product.stock > currentQty) {
        setCart((prev) =>
          itemInCart
            ? prev.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              )
            : [...prev, { ...product, quantity: 1 }]
        );
      } else {
        alert(`Sorry, only ${product.stock} available in stock.`);
      }
    },

    updateCartQuantity: (productId, amount) => {
      setCart((prev) => {
        const item = prev.find((i) => i.id === productId);
        const productInStock = products.find((p) => p.id === productId);
        if (!item || !productInStock) return prev;
        if (amount > 0 && item.quantity + amount > productInStock.stock) {
          alert(`Sorry, only ${productInStock.stock} available in stock.`);
          return prev;
        }
        if (item.quantity + amount <= 0) return prev.filter((i) => i.id !== productId);
        return prev.map((i) => (i.id === productId ? { ...i, quantity: i.quantity + amount } : i));
      });
    },

    removeFromCart: (productId) => setCart((prev) => prev.filter((i) => i.id !== productId)),

    checkout: () => {
      if (!user || user.role !== "customer") return;
      if (cart.length === 0) return;

      const updatedProducts = products.map((p) => {
        const cartItem = cart.find((ci) => ci.id === p.id);
        if (!cartItem) return p;
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      });
      persistProducts(updatedProducts);

      const newOrder = {
        id: `order-${Date.now()}`,
        customerId: user.id,
        customerName: user.name,
        products: cart.map((c) => ({ ...c })), // includes farmer info
        total: cart.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2),
        status: "New",
        createdAt: new Date().toLocaleString(),
      };

      persistOrders([...orders, newOrder]);
      setCart([]);
      alert("Thank you! Your order has been placed.");
      handlers.navigateTo("customerOrders");
    },

    saveProduct: (productData) => {
      if (!user || user.role !== "farmer") {
        alert("Only farmers can save products.");
        return;
      }
      const image =
        productData.image ||
        `https://placehold.co/600x400/87CEEB/333?text=${encodeURIComponent(
          productData.name
        )}`;
      const stock = parseInt(productData.stock, 10) || 0;
      const farmerLocation =
        user.farmDetails?.location || productData.farmerLocation || "Unknown";

      let updatedProducts;
      if (productData.id) {
        updatedProducts = products.map((p) =>
          p.id === productData.id
            ? { ...p, ...productData, image, stock, farmerLocation }
            : p
        );
      } else {
        const newProduct = {
          ...productData,
          id: `prod-${Date.now()}`,
          farmerId: user.id,
          farmerName: user.name,
          image,
          stock,
          farmerLocation,
        };
        updatedProducts = [...products, newProduct];
      }

      persistProducts(updatedProducts);
      alert("Product saved successfully!");
    },

    requestDeleteProduct: (productId) => {
      const product = products.find((p) => p.id === productId);
      setProductToDelete(product);
    },

    confirmDeleteProduct: () => {
      if (!productToDelete) return;
      const updatedProducts = products.filter((p) => p.id !== productToDelete.id);
      persistProducts(updatedProducts);
      setProductToDelete(null);
    },

    cancelDelete: () => setProductToDelete(null),

    updateProfile: (name, email, location, bio) => {
      const updatedUser = { ...user, name, email };
      if (user.role === "farmer") {
        updatedUser.farmDetails = { ...user.farmDetails, name: `${name}'s Farm`, location, bio };
        const updatedProducts = products.map((p) =>
          p.farmerId === user.id ? { ...p, farmerName: name, farmerLocation: location } : p
        );
        persistProducts(updatedProducts);
      }
      setUser(updatedUser);
      const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
      persistUsers(updatedUsers);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      alert("Profile updated!");
    },

    // --- View farmer and their products ---
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
      orders.filter(
        (o) => o.status === "New" && o.products.some((p) => p.farmerId === farmerId)
      ).length,

    markOrdersAsViewed: (farmerId) => {
      const updated = orders.map((o) =>
        o.status === "New" && o.products.some((p) => p.farmerId === farmerId)
          ? { ...o, status: "Processing" }
          : o
      );
      persistOrders(updated);
    },

    generateRecipe: async () => {
      if (cart.length === 0) return;
      const ingredients = cart.map((i) => i.name).join(", ");
      const prompt = `I have these ingredients from a local farm: ${ingredients}. Suggest a simple recipe.`;
      return await callGeminiAPI(prompt, setIsGenerating);
    },

    generateDescription: async (productName) => {
      if (!productName) return;
      const prompt = `Write a short, appealing one-sentence description for '${productName}'.`;
      return await callGeminiAPI(prompt, setIsGenerating);
    },

    handleLocationFilter: (location) => setLocationFilter(location),
  };

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  useEffect(() => {
    if (currentView === "farmerOrders" && user?.role === "farmer") {
      handlers.markOrdersAsViewed(user.id);
    }
  }, [currentView, user]); // eslint-disable-line

  // --- Render content ---
  const renderContent = () => {
    if (isLoading) return <div className="text-center text-xl">Loading...</div>;
    const props = { products, cart, user, users, orders, handlers, selectedFarmer, locationFilter };

    switch (currentView) {
      case "products":
        return <ProductsPage {...props} />;
      case "cart":
        return <CartPage {...props} />;
      case "login":
        return <LoginPage {...props} />;
      case "signup":
        return <SignupPage {...props} />;
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
          <FarmerProfilePage
            farmer={selectedFarmer}
            products={selectedFarmer.products}
            handlers={handlers}
          />
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
        newOrdersCount={user?.role === "farmer" ? handlers.getNewOrdersCount(user.id) : 0}
      />
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>

      {productToDelete && (
        <ConfirmationModal
          productName={productToDelete.name}
          onConfirm={handlers.confirmDeleteProduct}
          onCancel={handlers.cancelDelete}
        />
      )}
    </div>
  );
}
