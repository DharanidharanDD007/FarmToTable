import api from './axios';

export const login = async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
};

export const signup = async (userData) => {
    const response = await api.post('/users/signup', userData);
    return response.data;
};
