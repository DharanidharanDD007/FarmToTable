import React, { useState, useEffect } from 'react';
import * as orderApi from '../api/orders';

const OrderRow = ({ order, onUpdateStatus }) => {
    const [orderStatus, setOrderStatus] = useState(order.orderStatus || order.status);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync state with prop if order updates externally (e.g. from refetch)
    useEffect(() => {
        setOrderStatus(order.orderStatus || order.status);
    }, [order.orderStatus, order.status]);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await onUpdateStatus(order._id || order.id, orderStatus);
        } catch (error) {
            console.error('Failed to update order status:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update order status.';
            alert(`Error: ${errorMsg}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // Get valid next statuses based on current status
    const getNextStatuses = (currentStatus) => {
        const transitions = {
            'CONFIRMED': ['ACCEPTED', 'CANCELLED'],
            'ACCEPTED': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': ['DELIVERED'],
            'DELIVERED': [],
            'CANCELLED': []
        };
        return transitions[currentStatus] || [];
    };

    const nextStatuses = getNextStatuses(orderStatus);
    const canUpdate = nextStatuses.length > 0 && !isUpdating;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
            case 'ACCEPTED': return 'bg-yellow-100 text-yellow-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
                <div>
                    <p className="font-bold text-lg">
                        Order #{order.orderId || (order._id || order.id || "").slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                        Customer: {order.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                        Date: {formatDate(order.createdAt)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">Total: ₹{order.total}</p>
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(orderStatus)}`}>
                        {orderStatus}
                    </span>
                </div>
            </div>

            {canUpdate && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                    <label className="text-sm font-medium">Update Status:</label>
                    <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="border rounded px-2 py-1 text-sm bg-white flex-1"
                    >
                        <option value={orderStatus} disabled>Current: {orderStatus}</option>
                        {nextStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                    >
                        {isUpdating ? 'Updating...' : 'Update'}
                    </button>
                </div>
            )}

            {orderStatus === 'DELIVERED' && order.deliveredAt && (
                <p className="text-sm text-green-600 mb-2">
                    ✓ Delivered on: {formatDate(order.deliveredAt)}
                </p>
            )}

            <h4 className="font-semibold text-gray-700 mb-2">Ordered Items:</h4>
            <ul className="list-disc pl-5 space-y-1">
                {(order.orderedItems || order.products || []).map((item, index) => (
                    <li key={item.productId || item.id || index} className="text-gray-800">
                        <span className="font-medium">{item.quantity} x</span> {item.name}
                        <span className="text-gray-500"> @ ₹{item.price}/{item.unit}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const FarmerOrdersPage = ({ user, handlers }) => {
    const [activeOrders, setActiveOrders] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const [active, history] = await Promise.all([
                orderApi.getFarmerActiveOrders(),
                orderApi.getFarmerOrderHistory()
            ]);
            setActiveOrders(active);
            setHistoryOrders(history);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            alert('Failed to load orders. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await orderApi.updateOrderStatus(orderId, newStatus);
            // Refresh orders after update
            await fetchOrders();
            alert(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update order:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    const currentOrders = activeTab === 'active' ? activeOrders : historyOrders;

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => handlers.navigateTo("farmerDashboard")}
                className="mb-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
                <span>&larr;</span> Back to Dashboard
            </button>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">My Orders</h2>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'active'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Active Orders ({activeOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'history'
                                ? 'border-b-2 border-blue-600 text-blue-600'
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
                                ? 'Orders with status CONFIRMED, ACCEPTED, or SHIPPED will appear here.'
                                : 'Delivered orders will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {currentOrders.map((order) => (
                            <OrderRow
                                key={order._id || order.id}
                                order={order}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerOrdersPage;