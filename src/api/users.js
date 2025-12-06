import api from './axios';

export const getFarmers = async () => {
    const response = await api.get('/users/farmers');
    return response.data;
};

export const getCustomers = async () => {
    const response = await api.get('/users/customers');
    return response.data;
};
