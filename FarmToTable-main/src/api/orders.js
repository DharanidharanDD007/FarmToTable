import api from './axios';

/**
 * ============================================
 * ORDER API - Updated for New Order Structure
 * ============================================
 */

// Create new order (customers only)
export const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

// Get customer's ALL orders (complete history - all statuses)
export const getCustomerOrders = async () => {
    const response = await api.get('/orders/customer/my-orders');
    return response.data.orders || [];
};

// Get farmer's ACTIVE orders (CONFIRMED, ACCEPTED, SHIPPED)
export const getFarmerActiveOrders = async () => {
    const response = await api.get('/orders/farmer/active');
    return response.data.orders || [];
};

// Get farmer's ORDER HISTORY (DELIVERED orders)
export const getFarmerOrderHistory = async () => {
    const response = await api.get('/orders/farmer/history');
    return response.data.orders || [];
};

// Get farmer's ALL orders (both active and history)
export const getFarmerAllOrders = async () => {
    const response = await api.get('/orders/farmer/all');
    return response.data;
};

// Get order by ID
export const getOrderById = async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.order;
};

// Update order status (farmers only)
export const updateOrderStatus = async (orderId, orderStatus) => {
    const response = await api.put(`/orders/${orderId}/status`, { orderStatus });
    return response.data;
};

// Legacy support (for backward compatibility during migration)
export const getOrders = async () => {
    // This will be handled by role-based logic in App.jsx
    console.warn('getOrders() is deprecated. Use getCustomerOrders() or getFarmerActiveOrders() instead.');
    return [];
};

export const getUserOrders = async (userId) => {
    // Redirect to new endpoint
    return getCustomerOrders();
};
