import api from './axios';

export const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const getOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

export const getUserOrders = async (userId) => {
    const response = await api.get(`/orders/${userId}`);
    return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
};
