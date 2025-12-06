import api from './axios';

export const getCart = async (userId) => {
    const response = await api.get(`/cart/${userId}`);
    return response.data;
};

export const addToCart = async (userId, productId, quantity) => {
    const response = await api.post('/cart', { userId, productId, quantity });
    return response.data;
};

export const updateCartQuantity = async (userId, productId, quantity) => {
    const response = await api.put('/cart/quantity', { userId, productId, quantity });
    return response.data;
};

export const removeFromCart = async (userId, productId) => {
    // Axios delete with body requires 'data' property
    const response = await api.delete('/cart', { data: { userId, productId } });
    return response.data;
};

export const clearCart = async (userId) => {
    const response = await api.delete('/cart/clear', { data: { userId } });
    return response.data;
};
