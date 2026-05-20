import api from './axios';

export const login = async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
};

export const signup = async (userData) => {
    const response = await api.post('/users/signup', userData);
    return response.data;
};

export const googleLogin = async (payload) => {
    const response = await api.post('/users/google-auth', payload);
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
};
