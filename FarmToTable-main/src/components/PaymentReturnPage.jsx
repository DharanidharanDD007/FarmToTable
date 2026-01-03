import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function PaymentReturnPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying payment...');
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            setMessage('No order ID found. Please check your orders.');
            return;
        }

        // Verify payment after a short delay to allow Cashfree to process
        const verifyPayment = async () => {
            try {
                // Get cart items from sessionStorage if available
                const cartItemsStr = sessionStorage.getItem('pendingPaymentCart');
                const cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];

                const response = await api.post('/payments/verify', {
                    orderId: orderId,
                    cartItems: cartItems
                });

                if (response.data.success) {
                    setStatus('success');
                    setMessage('Payment successful! Your order has been placed.');
                    // Clear pending cart from session
                    sessionStorage.removeItem('pendingPaymentCart');
                    
                    // Redirect to orders page after 3 seconds
                    setTimeout(() => {
                        navigate('/customerOrders');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(response.data.message || 'Payment verification failed. Please check your orders.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                setStatus('error');
                setMessage('Payment verification failed. Please check your orders page.');
            }
        };

        // Wait a bit for Cashfree to process
        setTimeout(verifyPayment, 2000);
    }, [orderId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to your orders...</p>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Issue</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <button
                            onClick={() => navigate('/customerOrders')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Check Orders
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}


