import React, { useState } from "react";

const CustomerOrdersPage = ({ user, orders, handlers }) => {
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const handleViewFarmer = (farmerId) => {
    handlers.viewFarmer(farmerId);
    setSelectedFarmer(handlers.getFarmerWithProducts(farmerId)); // get farmer + products
  };

  const closeFarmerView = () => setSelectedFarmer(null);



  // Orders are already filtered by App.jsx
  // CRITICAL: Customer must see ALL orders (all statuses)
  const myOrders = Array.isArray(orders) ? orders : [];

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

  return (
    <div>
      <button
        onClick={() => handlers.goToProducts()}
        className="mb-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300"
      >
        &larr; Back to Products
      </button>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">My Order History</h2>
        <p className="text-gray-600 mb-6">All your orders are shown here, including current and past orders.</p>

        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">You have no orders yet.</p>
            <p className="text-sm mt-2">Your orders will appear here once you place them.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map(order => (
              <div key={order._id || order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <div>
                    <p className="font-bold text-lg">Order #{order.orderId || (order._id || order.id || "").slice(-6)}</p>
                    <p className="text-sm text-gray-500">Placed on: {formatDate(order.createdAt)}</p>
                    {order.deliveredAt && (
                      <p className="text-sm text-green-600">Delivered on: {formatDate(order.deliveredAt)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">Total: ₹{order.total}</p>
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(order.orderStatus || order.status)}`}>
                      {order.orderStatus || order.status || 'UNKNOWN'}
                    </span>
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
