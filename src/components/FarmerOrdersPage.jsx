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
                {orders.filter((o) =>
                    o.products.some((p) => p.farmerId === user.id)
                ).length === 0 ? (
                    <p>You have no orders yet.</p>
                ) : (
                    orders
                        .filter((o) =>
                            o.products.some((p) => p.farmerId === user.id)
                        )
                        .map((order) => (
                            <div
                                key={order.id}
                                className="border rounded-lg p-4"
                            >
                                <div className="flex justify-between items-center border-b pb-2 mb-2">
                                    <div>
                                        <p className="font-bold">
                                            Order #{order.id.slice(-6)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            From: {order.customerName}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 text-sm rounded-full ${
                                            order.status === "New"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }`}
                                    >
                                        {order.status}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 mb-2">
                                    Date: {order.createdAt}
                                </p>

                                <h4 className="font-semibold">Items to Prepare:</h4>
                                <ul className="list-disc pl-5">
                                    {order.products
                                        .filter((p) => p.farmerId === user.id)
                                        .map((p) => (
                                            <li key={p.id}>
                                                {p.quantity} x {p.name}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ))
                )}
            </div>
        </div>
    </div>
);

export default FarmerOrdersPage;
