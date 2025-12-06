const FarmerOrdersPage = ({ user, orders, handlers }) => (
    <div>
        <button
            onClick={() => handlers.navigateTo("farmerDashboard")}
            className="mb-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300"
        >
            &larr; Back to Dashboard
        </button>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Incoming Orders</h2>

            <div className="space-y-6">
                {(() => {
                    const userId = user.id || user._id;
                    return orders.filter((o) =>
                        (o.products || []).some((p) => p.farmerId === userId)
                    ).length === 0 ? (
                        <p>You have no orders yet.</p>
                    ) : (
                        orders
                            .filter((o) =>
                                (o.products || []).some((p) => p.farmerId === userId)
                            )
                            .map((order) => (
                                <div
                                    key={order.id || order._id}
                                    className="border rounded-lg p-4"
                                >
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
                                                defaultValue={order.status}
                                                className="border rounded px-2 py-1 text-sm"
                                                id={`status-${order.id || order._id}`}
                                            >
                                                <option value="New">New</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const newStatus = document.getElementById(`status-${order.id || order._id}`).value;
                                                    handlers.updateOrderStatus(order.id || order._id, newStatus);
                                                }}
                                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-2">
                                        Date: {order.createdAt}
                                    </p>

                                    <h4 className="font-semibold">Items to Prepare:</h4>
                                    <ul className="list-disc pl-5">
                                        {(order.products || [])
                                            .filter((p) => p.farmerId === (user.id || user._id))
                                            .map((p) => (
                                                <li key={p.id}>
                                                    {p.quantity} x {p.name}
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )))
                })()}
            </div>
        </div>
    </div>
);

export default FarmerOrdersPage;
