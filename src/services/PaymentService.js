import api from '../api/axios';

export const PaymentService = {
    checkout: async ({ cart, user, totalAmount, onSuccess, onError }) => {
        try {
            // 1. Create Order on Backend
            const response = await api.post("/payments/create-order", {
                amount: totalAmount
            });

            const orderData = response.data;

            if (!orderData.id) {
                throw new Error("Failed to create order");
            }

            // 2. Razorpay Options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use VITE_ prefix for Vite apps
                amount: orderData.amount,
                currency: "INR",
                name: "Farm to Table",
                description: "Fresh Produce Purchase",
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Verify Payment on Backend
                    try {
                        // Note: userId and userName are now handled by backend from authenticated user
                        const verifyRes = await api.post("/payments/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            cartItems: cart,
                            totalAmount: totalAmount,
                        });

                        const verifyData = verifyRes.data;

                        if (verifyData.success) {
                            onSuccess(verifyData);
                        } else {
                            onError("Payment verification failed");
                        }
                    } catch (err) {
                        onError("Verification error: " + err.message);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: "9999999999", // Mock or user phone
                },
                theme: {
                    color: "#3399cc",
                },
            };

            // 4. Open Razorpay
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                onError(response.error.description);
            });
            rzp.open();
        } catch (error) {
            onError(error.message);
        }
    },
};
