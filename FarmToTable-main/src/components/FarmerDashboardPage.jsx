import { useState, useEffect } from "react";
import EditIcon from "../icons/EditIcon";
import TrashIcon from "../icons/TrashIcon";
import ProductFormModal from "./ProductFormModal";
import * as orderApi from "../api/orders";

const FarmerDashboardPage = ({ user, products, handlers }) => {
    const [isFormVisible, setFormVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormVisible(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormVisible(true);
    };

    useEffect(() => {
        const fetchOrdersForAnalytics = async () => {
            try {
                setLoadingOrders(true);
                const [active, history] = await Promise.all([
                    orderApi.getFarmerActiveOrders(),
                    orderApi.getFarmerOrderHistory()
                ]);
                setOrders([...active, ...history]);
            } catch (error) {
                console.error("Failed to load orders for analytics:", error);
            } finally {
                setLoadingOrders(false);
            }
        };
        fetchOrdersForAnalytics();
    }, []);

    // Calculate Analytics Metrics
    const completedOrders = orders.filter(o => (o.orderStatus || o.status) === "DELIVERED");
    const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrdersCount = orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.orderStatus || o.status)).length;
    
    // Calculate product sales breakdown
    const productSales = {};
    completedOrders.forEach(order => {
        const items = order.orderedItems || order.products || [];
        items.forEach(item => {
            const name = item.name;
            const qty = item.quantity || 0;
            const rev = (item.price || 0) * qty;
            if (!productSales[name]) {
                productSales[name] = { qty: 0, revenue: 0 };
            }
            productSales[name].qty += qty;
            productSales[name].revenue += rev;
        });
    });

    const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const maxRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.revenue)) : 1;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-3xl font-extrabold text-gray-800">My Farmer Dashboard</h2>
                <span className="bg-green-100 text-green-800 px-3.5 py-1.5 rounded-full text-sm font-semibold">
                    Live Farm Status
                </span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
                    onClick={() => handlers.navigateTo("farmerOrders")}
                >
                    <h3 className="text-xl font-bold">View My Orders</h3>
                    <p className="mt-2 text-blue-100">See incoming orders and update delivery status.</p>
                </div>

                <div
                    className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
                    onClick={handleAddNew}
                >
                    <h3 className="text-xl font-bold">Manage My Products</h3>
                    <p className="mt-2 text-green-100">Add new fresh harvest items or edit listings.</p>
                </div>
            </div>

            {/* Sales & Analytics Section */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    📊 Performance & Analytics
                </h3>
                
                {loadingOrders ? (
                    <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500 text-sm">Calculating sales data...</p>
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                                <p className="text-sm font-semibold text-gray-500">Total Earnings</p>
                                <p className="text-3xl font-black text-green-600 mt-2">₹{totalEarnings.toFixed(2)}</p>
                                <p className="text-xs text-gray-400 mt-1">From completed orders</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                                <p className="text-sm font-semibold text-gray-500">Active Orders</p>
                                <p className="text-3xl font-black text-blue-600 mt-2">{activeOrdersCount}</p>
                                <p className="text-xs text-gray-400 mt-1">Awaiting delivery</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                                <p className="text-sm font-semibold text-gray-500">Orders Completed</p>
                                <p className="text-3xl font-black text-purple-600 mt-2">{completedOrders.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Successfully delivered</p>
                            </div>
                        </div>

                        {/* Top Products CSS Bar Chart */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-4 text-lg">Top Selling Products</h4>
                            {topProducts.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No sales recorded yet to show breakdown.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topProducts.map((p, idx) => {
                                        const pct = (p.revenue / maxRevenue) * 100;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-semibold text-gray-700">{p.name} ({p.qty} sold)</span>
                                                    <span className="font-bold text-green-600">₹{p.revenue.toFixed(2)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3.5">
                                                    <div 
                                                        className="bg-green-500 h-3.5 rounded-full transition-all duration-500" 
                                                        style={{ width: `${pct}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Current Listings */}
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Your Current Listings</h3>
                <div className="space-y-4">
                    {(() => {
                        const userId = user.id || user._id;
                        const userProducts = products.filter((p) => p.farmerId === userId);
                        return userProducts.length > 0 ? (
                            userProducts.map((p) => (
                                <div
                                    key={p.id || p._id}
                                    className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-150 hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            {p.name}{" "}
                                            <span className="font-normal text-sm text-gray-500 ml-2">
                                                ({p.stock} {p.unit || 'units'} in stock)
                                            </span>
                                        </p>
                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                            ₹{p.price} / {p.unit}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handlers.requestDeleteProduct(p.id || p._id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">
                                You have no products listed. Click 'Manage My Products' to add one!
                            </p>
                        );
                    })()}
                </div>
            </div>

            {/* Recipe Generator for Farmer */}
            <div className="border-t pt-6">
                <button
                    onClick={async () => {
                        const result = await handlers.generateRecipe();
                        if (result) alert("Recipe Idea:\n" + result);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                >
                    ✨ Get Recipe Ideas from My Products
                </button>
            </div>

            {isFormVisible && (
                <ProductFormModal
                    product={editingProduct}
                    handlers={handlers}
                    onClose={() => setFormVisible(false)}
                />
            )}
        </div>
    );
};

export default FarmerDashboardPage;
