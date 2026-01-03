import api from '../api/axios';

// Helper to load Razorpay SDK dynamically
const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const PaymentService = {
    checkout: async ({ cart, user, onSuccess, onError }) => {
        try {
            // 1. Load Razorpay SDK
            const res = await loadRazorpay();
            if (!res) {
                onError("Razorpay SDK failed to load. Are you online?");
                return;
            }

            // 2. Create Order in Backend
            const result = await api.post("/payments/create-order", {
                cartItems: cart
            });

            if (!result) {
                onError("Server error. Are you online?");
                return;
            }

            const { amount, currency, Order_id, order_id, key_id } = result.data;
            const openOrderId = order_id || Order_id; // Handle case variation

            if (!openOrderId) {
                onError("Failed to create order. Please try again.");
                return;
            }

            // 3. Configure Razorpay Options
            const options = {
                key: key_id, // Enter the Key ID generated from the Dashboard
                amount: amount.toString(),
                currency: currency,
                name: "Farm To Table",
                description: "Fresh Farm Products",
                order_id: openOrderId,
                handler: async function (response) {
                    try {
                        const data = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            cartItems: cart
                        };

                        // 4. Verify Payment on Backend
                        const verifyResult = await api.post("/payments/verify", data);

                        if (verifyResult.data.success) {
                            onSuccess(verifyResult.data);
                        } else {
                            onError(verifyResult.data.message || "Payment verification failed");
                        }
                    } catch (error) {
                        console.error("Verification Error:", error);
                        onError("Payment verification failed via server");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || "9999999999"
                },
                notes: {
                    address: "Razorpay Corporate Office"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            // 4. Open Razorpay Checkout
            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response) {
                onError(response.error.description || "Payment Failed");
            });
            paymentObject.open();

        } catch (error) {
            console.error("Payment Error:", error);
            const msg = error.response?.data?.error || error.message || "Payment failed. Please try again.";
            onError(msg);
        }
    },
};