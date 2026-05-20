import React, { useState, useEffect } from "react";
import * as orderApi from "../api/orders";
import callGeminiAPI from "../api/gemini";

const CustomerOrdersPage = ({ user, handlers }) => {
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [myOrders, setMyOrders] = useState([]); // Local state for orders
  const [activeTab, setActiveTab] = useState('active');
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI suggestion state
  const [recipe, setRecipe] = useState("");
  const [generating, setGenerating] = useState(false);
  const [recipeError, setRecipeError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const orders = await orderApi.getCustomerOrders();
      const all = Array.isArray(orders) ? orders : [];
      setMyOrders(all);

      setActiveOrders(all.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus || o.status)));
      setHistoryOrders(all.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus || o.status)));
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    try {
      if(!window.confirm("Confirm that you have received this order?")) return;
      await orderApi.customerReceiveOrder(orderId);
      
      await fetchOrders();
      setActiveTab('history');
      alert("Receipt confirmed! Order moved to History.");
    } catch (error) {
      console.error("Failed to confirm receipt:", error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSaveReceipt = (order) => {
    try {
        let receiptText = `===============================\n`;
        receiptText += `          FARM TO TABLE          \n`;
        receiptText += `===============================\n\n`;
        receiptText += `Order ID: ${order.orderId || order._id}\n`;
        receiptText += `Date Placed: ${formatDate(order.createdAt)}\n`;
        receiptText += `Date Delivered: ${formatDate(order.deliveredAt)}\n`;
        receiptText += `Status: ${order.orderStatus || order.status}\n\n`;
        receiptText += `Farmer: ${order.farmerName || 'N/A'}\n\n`;
        receiptText += `Items:\n`;
        
        (order.orderedItems || order.products || []).forEach(item => {
            receiptText += `- ${item.quantity}x ${item.name} (@ ₹${item.price}/${item.unit}): ₹${(item.quantity * item.price).toFixed(2)}\n`;
        });
        
        receiptText += `\n-------------------------------\n`;
        receiptText += `Total Paid: ₹${order.total}\n`;
        receiptText += `-------------------------------\n`;
        receiptText += `Thank you for shopping with us!\n`;

        const blob = new Blob([receiptText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Receipt_${order.orderId || order._id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate receipt", error);
        alert("Failed to generate receipt file.");
    }
  };

  const handleViewFarmer = (farmerId) => {
    handlers.viewFarmer(farmerId);
    setSelectedFarmer(handlers.getFarmerWithProducts(farmerId)); // get farmer + products
  };

  const closeFarmerView = () => setSelectedFarmer(null);

  // Extract unique purchased ingredients
  const purchasedIngredients = myOrders
    .flatMap(order => order.orderedItems || order.products || [])
    .reduce((acc, item) => {
      if (!acc.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
        acc.push(item);
      }
      return acc;
    }, []);

  // Trigger Gemini API Recipe recommendation
  const handleGenerateRecipe = async () => {
    if (purchasedIngredients.length === 0) return;
    setGenerating(true);
    setRecipeError("");
    setRecipe("");
    try {
      const ingredientNames = purchasedIngredients.map(item => item.name).join(", ");
      const generatedRecipe = await callGeminiAPI(ingredientNames);
      setRecipe(generatedRecipe);
    } catch (err) {
      console.error(err);
      setRecipeError("Failed to fetch recipe recommendations. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  const currentOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => handlers.goToProducts()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2 font-semibold"
        >
          <span>&larr;</span> Back to Products
        </button>
        <button
          onClick={fetchOrders}
          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
        >
          Refresh List
        </button>
      </div>

      {/* 👨‍🍳 Cook with Your Fresh Purchases (AI Recommendation Widget) */}
      {purchasedIngredients.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-emerald-950/30 p-6 rounded-2xl shadow-md border border-emerald-200 dark:border-emerald-800/40 mb-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span>👨‍🍳</span> Chef's Suggestion: Cook with Farm Fresh Ingredients
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Let our AI suggest a delicious, healthy recipe based on your purchased items:
              </p>
              
              {/* Ingredients tag deck */}
              <div className="flex flex-wrap gap-2 mt-3">
                {purchasedIngredients.map((item, index) => (
                  <span key={item.productId || index} className="px-3 py-1 bg-white dark:bg-gray-800 text-xs font-bold text-green-700 dark:text-green-300 border border-green-200 dark:border-gray-700 rounded-full shadow-sm">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleGenerateRecipe}
              disabled={generating}
              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2 self-start md:self-center whitespace-nowrap"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Suggesting...
                </>
              ) : (
                <>
                  <span>✨</span> Recommend Dishes
                </>
              )}
            </button>
          </div>

          {/* Generated Recipe Box */}
          {recipe && (
            <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-inner border border-emerald-100 dark:border-gray-800 relative animate-in fade-in duration-300">
              <button 
                onClick={() => setRecipe("")} 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
                title="Clear recipe"
              >
                ✕ Clear
              </button>
              
              <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                <div style={{ whiteSpace: "pre-wrap" }} className="leading-relaxed font-sans text-sm md:text-base">
                  {recipe}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end gap-2 border-t pt-4 dark:border-gray-800">
                <button
                  onClick={() => {
                    const blob = new Blob([recipe], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "Farm_Fresh_AI_Recipe.txt";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  📥 Save Recipe (.txt)
                </button>
              </div>
            </div>
          )}

          {recipeError && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl text-sm flex gap-2">
              <span>⚠️</span>
              <p>{recipeError}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Orders List container */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">My Orders</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
            <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'active'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
            >
                Active Orders ({activeOrders.length})
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'history'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
            >
                Order History ({historyOrders.length})
            </button>
        </div>

        {currentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">
                {activeTab === 'active'
                    ? 'You have no active orders.'
                    : 'You have no order history yet.'}
            </p>
            <p className="text-sm mt-2">
                {activeTab === 'active'
                    ? 'Orders being processed or shipped will appear here.'
                    : 'Orders you have received will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentOrders.map(order => (
              <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <div>
                    <p className="font-bold text-lg">Order #{order.orderId || (order._id || order.id || "").slice(-6)}</p>
                    <p className="text-sm text-gray-500">Placed on: {formatDate(order.createdAt)}</p>
                    {order.deliveredAt && (
                      <p className="text-sm text-green-600 font-semibold mb-1">✓ Delivered on: {formatDate(order.deliveredAt)}</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-bold text-lg">Total: ₹{order.total}</p>
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(order.orderStatus || order.status)}`}>
                      {order.orderStatus || order.status || 'UNKNOWN'}
                    </span>
                    {(order.orderStatus === 'SHIPPED') && (
                      <button
                        onClick={() => handleConfirmReceipt(order._id || order.id)}
                        className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors shadow flex gap-1 items-center"
                      >
                         Confirm Receipt
                      </button>
                    )}
                    {(order.orderStatus === 'DELIVERED') && (
                      <button
                        onClick={() => handleSaveReceipt(order)}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors shadow flex gap-1 items-center"
                      >
                         📄 Save Receipt
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-semibold text-gray-700 mb-2">Farmer: {order.farmerName || 'N/A'}</p>
                  <div className="space-y-2">
                    {(order.orderedItems || order.products || []).map((item, index) => (
                      <div key={item.productId || item.id || index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.quantity} x {item.name} @ ₹{item.price}/{item.unit}
                          </p>
                          <p className="text-sm text-gray-500">Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleViewFarmer(item.farmerId)}
                          className="text-sm text-blue-600 hover:underline ml-4"
                        >
                          View Farmer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Farmer Modal / View */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full overflow-auto relative">
            <button
              onClick={closeFarmerView}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-3xl font-bold mb-2">{selectedFarmer.name}'s Farm</h2>
            <p className="text-gray-600">Location: {selectedFarmer.farmDetails.location}</p>
            <p className="text-gray-600 mb-4">Bio: {selectedFarmer.farmDetails.bio}</p>

            <h3 className="text-2xl font-semibold mb-4">Products</h3>
            {selectedFarmer.products.length === 0 ? (
              <p>No products available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedFarmer.products.map(prod => (
                  <div key={prod.id} className="bg-gray-50 rounded-lg shadow-md overflow-hidden flex flex-col">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/CCCCCC/FFFFFF?text=No+Image'; }}
                    />
                    <div className="p-4 flex flex-col flex-grow">
                      <h4 className="text-lg font-semibold">{prod.name}</h4>
                      <p className="text-gray-500">{prod.stock} in stock</p>
                      <p className="text-green-600 font-bold mt-2">₹{prod.price} / {prod.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
