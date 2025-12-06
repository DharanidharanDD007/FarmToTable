import React, { useState } from 'react';

const PaymentModal = ({ totalAmount, onConfirm, onCancel }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
    const [upiId, setUpiId] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        setError('');
        setIsProcessing(true);

        // Simulate a short delay for "processing"
        setTimeout(() => {
            // Failure Simulation Logic
            if (paymentMethod === 'card' && cardDetails.cvv === '000') {
                setError('Payment Declined: Invalid CVV or Bank Rejection');
                setIsProcessing(false);
                return;
            }
            if (paymentMethod === 'upi' && upiId.endsWith('@fail')) {
                setError('Payment Failed: UPI Transaction Declined');
                setIsProcessing(false);
                return;
            }

            onConfirm({
                method: paymentMethod,
                details: paymentMethod === 'card' ? cardDetails : (paymentMethod === 'upi' ? { upiId } : {})
            });
        }, 1500);
    };

    const isValid = () => {
        if (paymentMethod === 'card') {
            return cardDetails.number && cardDetails.expiry && cardDetails.cvv;
        }
        if (paymentMethod === 'upi') {
            return upiId.includes('@');
        }
        return true; // COD is always valid
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Order</h2>

                <div className="mb-6 text-center bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-gray-600 mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-green-700">₹{totalAmount}</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-center font-semibold">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Select Payment Method:</label>
                    <div className="space-y-2">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'card' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="card"
                                checked={paymentMethod === 'card'}
                                onChange={(e) => { setPaymentMethod(e.target.value); setError(''); }}
                                className="mr-3 h-5 w-5 text-blue-600"
                            />
                            <span className="flex-1 font-medium">Credit/Debit Card</span>
                            <span className="text-xl">💳</span>
                        </label>

                        {paymentMethod === 'card' && (
                            <div className="ml-8 mt-2 space-y-2 p-3 bg-gray-50 rounded border border-gray-200">
                                <input
                                    type="text"
                                    placeholder="Card Number"
                                    className="w-full p-2 border rounded"
                                    value={cardDetails.number}
                                    onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        className="w-1/2 p-2 border rounded"
                                        value={cardDetails.expiry}
                                        onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="CVV (Use 000 to fail)"
                                        className="w-1/2 p-2 border rounded"
                                        value={cardDetails.cvv}
                                        onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="upi"
                                checked={paymentMethod === 'upi'}
                                onChange={(e) => { setPaymentMethod(e.target.value); setError(''); }}
                                className="mr-3 h-5 w-5 text-blue-600"
                            />
                            <span className="flex-1 font-medium">UPI (GPay, PhonePe)</span>
                            <span className="text-xl">📱</span>
                        </label>

                        {paymentMethod === 'upi' && (
                            <div className="ml-8 mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                                <input
                                    type="text"
                                    placeholder="Enter UPI ID (ends with @fail to fail)"
                                    className="w-full p-2 border rounded"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                />
                            </div>
                        )}

                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cod"
                                checked={paymentMethod === 'cod'}
                                onChange={(e) => { setPaymentMethod(e.target.value); setError(''); }}
                                className="mr-3 h-5 w-5 text-blue-600"
                            />
                            <span className="flex-1 font-medium">Cash on Delivery</span>
                            <span className="text-xl">💵</span>
                        </label>

                        {paymentMethod === 'cod' && (
                            <div className="ml-8 mt-2 p-2 text-sm text-gray-600">
                                Pay cash when your order is delivered.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold transition-colors"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold shadow-md transition-transform transform ${isValid() && !isProcessing ? 'bg-green-600 hover:bg-green-700 hover:scale-105' : 'bg-gray-400 cursor-not-allowed'}`}
                        disabled={isProcessing || !isValid()}
                    >
                        {isProcessing ? 'Processing...' : 'Pay & Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
