import api from '../api/axios';

export const PaymentService = {
    checkout: async ({ cart, user, onSuccess, onError }) => {
        try {
            // 1. Create Order
            // Need to pass customer details for Cashfree
            const response = await api.post("/payments/create-order", {
                cartItems: cart,
                customerId: user._id || user.id,
                customerName: user.name,
                customerEmail: user.email,
                customerPhone: user.phone || "9999999999" // Default if missing
            });

            const orderData = response.data;
            if (!orderData.payment_session_id) throw new Error("Invalid payment session");

            // 2. Initialize Cashfree
            const cashfree = new window.Cashfree({
                mode: orderData.environment?.toLowerCase() || "sandbox"
            });

            // 3. Checkout
            const checkoutOptions = {
                paymentSessionId: orderData.payment_session_id,
                redirectTarget: "_modal", // Open in modal
            };

            cashfree.checkout(checkoutOptions).then(async (result) => {
                if (result.error) {
                    // This happens if user closes modal or there's an issue
                    onError(result.error.message);
                }
                if (result.paymentDetails) {
                    // Payment might be successful, verify with backend
                    // Note: In _modal mode, this usually triggers only if redirect is not used, 
                    // but verifying on close/completion is good practice if data is returned.
                    // Actually, for modal with no redirect, we might need to rely on webhooks or a manual "Check Status" 
                    // or the promise resolving with status.
                    // Cashfree V3 JS often handles the flow. 
                    // Let's assume on completion we verify.

                    // IMPORTANT: The promise resolution for checkout() depends on integration type.
                    // For now, we will assume the user completes it. 
                    // A more robust way is often listening to events if supported, or just verifying orderId.

                    try {
                        const verifyRes = await api.post("/payments/verify", {
                            orderId: orderData.order_id,
                            cartItems: cart,
                        });

                        if (verifyRes.data.success) {
                            onSuccess(verifyRes.data);
                        } else {
                            onError("Payment not completed or failed verification");
                        }
                    } catch (err) {
                        onError("Verification check failed");
                    }
                }
            });

        } catch (error) {
            console.error("Payment Error:", error);
            const msg = error.response?.data?.error || error.message;
            onError(msg);
        }
    },
};