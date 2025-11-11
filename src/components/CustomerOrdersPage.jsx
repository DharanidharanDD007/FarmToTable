import React, { useState } from "react";

const CustomerOrdersPage = ({ user, orders, handlers }) => {
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const handleViewFarmer = (farmerId) => {
    handlers.viewFarmer(farmerId);
    setSelectedFarmer(handlers.getFarmerWithProducts(farmerId)); // get farmer + products
  };

  const closeFarmerView = () => setSelectedFarmer(null);

  const myOrders = orders.filter(o => o.customerId === user.id);

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

        {myOrders.length === 0 ? (
          <p>You have no past orders.</p>
        ) : (
          <div className="space-y-6">
            {myOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <div>
                    <p className="font-bold">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm">Placed on: {order.createdAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Total: ₹{order.total}</p>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        order.status === "New"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      Status: {order.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {order.products.map(p => (
                    <div key={p.id} className="flex justify-between items-center py-2">
                      <p>
                        {p.quantity} x {p.name}
                      </p>
                      <button
                        onClick={() => handleViewFarmer(p.farmerId)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Farmer: {p.farmerName}
                      </button>
                    </div>
                  ))}
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
                      onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/CCCCCC/FFFFFF?text=No+Image'; }}
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
