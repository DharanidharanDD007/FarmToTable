import React, { useState } from 'react';

const OrderRow = ({ order, userId, onUpdateStatus }) => {
    const [status, setStatus] = useState(order.status);

    const handleUpdate = () => {
        onUpdateStatus(order.id || order._id, status);
    };

    return (
        <div className="border rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
                <div>
                    <p className="font-bold">
                        Order #{(order.id || order._id || "").slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                        From: {order.customerName}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border rounded px-2 py-1 text-sm bg-white"
                    >
                        <option value="New">New</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                        onClick={handleUpdate}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                        Update
                    </button>
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-2">
                Date: {new Date(order.createdAt).toLocaleDateString()}
            </p>

            <h4 className="font-semibold text-gray-700">Items to Prepare:</h4>
            <ul className="list-disc pl-5 mt-1">
                {(order.products || [])
                    .filter((p) => p.farmerId === userId)
                    .map((p, index) => (
                        <li key={index} className="text-gray-800">
                            <span className="font-medium">{p.quantity} x</span> {p.name}
                        </li>
                    ))}
            </ul>
        </div>
    );
};

const FarmerOrdersPage = ({ user, orders, handlers }) => {
    const userId = user?.id || user?._id;

    // Filter orders that contain at least one product from this farmer
    const myOrders = orders.filter(order => 
        (order.products || []).some(p => p.farmerId === userId)
    );

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => handlers.navigateTo("farmerDashboard")}
                className="mb-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
                <span>&larr;</span> Back to Dashboard
            </button>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Incoming Orders</h2>

                {myOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">You have no orders yet.</p>
                        <p className="text-sm">Orders containing your products will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {myOrders.map((order) => (
                            <OrderRow 
                                key={order.id || order._id} 
                                order={order} 
                                userId={userId}
                                onUpdateStatus={handlers.updateOrderStatus}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerOrdersPage;