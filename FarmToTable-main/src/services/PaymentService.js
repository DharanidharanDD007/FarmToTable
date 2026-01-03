import api from '../api/axios';

// Helper to wait for Cashfree SDK to load
const waitForCashfree = (maxAttempts = 50, interval = 100) => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkCashfree = () => {
            if (window.Cashfree) {
                resolve(window.Cashfree);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkCashfree, interval);
            } else {
                reject(new Error("Cashfree SDK failed to load. Please refresh the page."));
            }
        };
        checkCashfree();
    });
};

export const PaymentService = {
    checkout: async ({ cart, user, onSuccess, onError }) => {
        try {
            // Validate inputs
            if (!cart || cart.length === 0) {
                onError("Cart is empty");
                return;
            }

            if (!user) {
                onError("Please login to proceed with payment");
                return;
            }

            // Store cart items in sessionStorage for return URL verification
            sessionStorage.setItem('pendingPaymentCart', JSON.stringify(cart));

            // 1. Create Order with Cashfree
            const response = await api.post("/payments/create-order", {
                cartItems: cart,
                customerId: user._id || user.id,
                customerName: user.name,
                customerEmail: user.email,
                customerPhone: user.phone || "9999999999"
            });

            const orderData = response.data;
            
            // Check for payment_session_id (Cashfree v3 format)
            if (!orderData.payment_session_id) {
                sessionStorage.removeItem('pendingPaymentCart');
                throw new Error("Invalid payment session. Please try again.");
            }

            // 2. Wait for Cashfree SDK to be available
            const Cashfree = await waitForCashfree();

            // 3. Initialize Cashfree
            const cashfree = new Cashfree({
                mode: orderData.environment?.toLowerCase() || "sandbox"
            });

            // 4. Setup checkout options - use redirect for more reliable flow
            const checkoutOptions = {
                paymentSessionId: orderData.payment_session_id,
                redirectTarget: "_self" // Redirect in same window (more reliable)
            };

            // 5. Handle checkout - with redirect mode, user will be redirected away
            // The PaymentReturnPage component will handle verification
            cashfree.checkout(checkoutOptions)
                .then((result) => {
                    // In redirect mode, this may not be called immediately
                    // User will be redirected to Cashfree payment page
                    console.log("Cashfree checkout initiated:", result);
                })
                .catch((error) => {
                    console.error("Cashfree checkout error:", error);
                    sessionStorage.removeItem('pendingPaymentCart');
                    // Check if it's a user cancellation
                    if (error.message && error.message.includes("cancelled")) {
                        onError("Payment was cancelled");
                    } else {
                        onError(error.message || "Payment initialization failed. Please try again.");
                    }
                });

        } catch (error) {
            console.error("Payment Error:", error);
            const msg = error.response?.data?.error || error.message || "Payment failed. Please try again.";
            onError(msg);
        }
    },
};