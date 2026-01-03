import React, { useState, useEffect } from "react";
import { CartService } from "../services/CartService";
import callGeminiAPI from "../api/gemini";
import api from "../api/axios";

export default function CartPage({ user, handlers }) {
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [recipes, setRecipes] = useState({});
    const [generatingRecipeId, setGeneratingRecipeId] = useState(null);

    const getUserId = () => user?.id || user?._id;

    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            fetchCart(userId);
        }
    }, [user]);

    const fetchCart = async (userId) => {
        try {
            setLoading(true);
            const data = await CartService.getCart(userId);
            setCartItems(data.items || []);
            setCartTotal(data.totalAmount || 0);
        } catch (error) {
            console.error("Failed to fetch cart", error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            const userId = getUserId();
            const data = await CartService.updateQuantity(userId, productId, newQuantity);
            setCartItems(data.items || []);
            setCartTotal(data.totalAmount || 0);
        } catch (error) {
            console.error("Failed to update quantity", error);
        }
    };

    const handleRemove = async (productId) => {
        try {
            const userId = getUserId();
            const data = await CartService.removeFromCart(userId, productId);
            setCartItems(data.items || []);
            setCartTotal(data.totalAmount || 0);
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    const handleGenerateRecipe = async (item) => {
        setGeneratingRecipeId(item.productId);
        const prompt = `Suggest a simple, delicious recipe using ${item.name}.`;
        try {
            const recipe = await callGeminiAPI(prompt, () => { });
            setRecipes(prev => ({ ...prev, [item.productId]: recipe }));
        } catch (error) {
            console.error("Recipe generation error:", error);
        } finally {
            setGeneratingRecipeId(null);
        }
    };

    // --- RAZORPAY INTEGRATION ---
    const handleFinalPayment = async () => {
        if (!user) {
            alert("Please login to proceed with payment");
            handlers.navigateTo("login");
            return;
        }

        if (cartItems.length === 0) {
            alert("Your cart is empty");
            return;
        }

        setProcessingPayment(true);

        try {
            // 1. Create Razorpay Order on your Backend
            const { data: orderResponse } = await api.post("/payments/razorpay-order", {
                amount: cartTotal,
            });

            // 2. Configure Razorpay Options
            const options = {
                key: "rzp_test_RzIHGVXzuloE1e",
                amount: orderResponse.amount,
                currency: "INR",
                name: "Farm To Table",
                description: "Purchase fresh produce",
                image: "/logo.png",
                order_id: orderResponse.id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment on Backend
                        // IMPORTANT: Map cartItems to ensure farmerId and farmerName are included
                        // Inside CartPage.jsx -> handleFinalPayment -> handler function
                        const verifyData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            cartItems: cartItems.map(item => ({
                                productId: item.productId,
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                                unit: item.unit,
                                image: item.image,
                                farmerId: item.farmerId,
                                farmerName: item.farmerName,
                            })),
                            amount: cartTotal
                        };

                        const { data: verificationResult } = await api.post("/payments/razorpay-verify", verifyData);

                        if (verificationResult.success) {
                            alert("Payment Successful! Order placed successfully.");
                            setCartItems([]);
                            setCartTotal(0);
                            if (handlers.refreshOrders) await handlers.refreshOrders();
                            handlers.navigateTo("customerOrders");
                        }
                    } catch (err) {
                        const errorMsg = err.response?.data?.error || err.message;
                        console.error("Verification Error:", errorMsg);
                        alert("Payment verification failed: " + errorMsg);
                    } finally {
                        setProcessingPayment(false);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || "9999999999"
                },
                theme: { color: "#16a34a" },
                modal: {
                    ondismiss: function () {
                        setProcessingPayment(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            const initErrorMsg = error.response?.data?.error || error.message;
            console.error("Razorpay Init Error:", initErrorMsg);
            alert("Failed to initiate payment: " + initErrorMsg);
            setProcessingPayment(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-xl font-semibold text-gray-600">Loading Cart...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Your Shopping Cart</h2>

            {cartItems.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-lg mb-4">Your cart is empty.</p>
                    <button
                        onClick={() => handlers.goToProducts()}
                        className="text-green-600 hover:underline font-medium"
                    >
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {cartItems.map((item) => (
                        <div key={item.productId} className="flex flex-col border-b pb-6 last:border-0 animate-fade-in">
                            <div className="flex items-center gap-6">
                                <img
                                    src={item.image || "https://placehold.co/100"}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded-md shadow-sm"
                                    onError={(e) => { e.target.src = 'https://placehold.co/100?text=No+Image'; }}
                                />
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                                    <p className="text-gray-500 text-sm">Farmer: {item.farmerName || "Local Farm"}</p>
                                    <p className="text-green-600 font-bold mt-1">₹{item.price} / {item.unit}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-100 px-3 py-1 rounded-full">
                                    <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-200 font-bold">-</button>
                                    <span className="font-semibold w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-200 font-bold">+</button>
                                </div>
                                <div className="text-right min-w-[100px]">
                                    <p className="font-bold text-lg">₹{item.subtotal}</p>
                                </div>
                                <button onClick={() => handleRemove(item.productId)} className="text-red-500 hover:text-red-700 p-2">🗑️</button>
                            </div>

                            <div className="mt-4 ml-0 md:ml-32">
                                {!recipes[item.productId] ? (
                                    <button onClick={() => handleGenerateRecipe(item)} disabled={generatingRecipeId === item.productId} className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-2">
                                        ✨ {generatingRecipeId === item.productId ? "Generating Recipe..." : "Suggest a Recipe"}
                                    </button>
                                ) : (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-gray-700 mt-2">
                                        <h4 className="font-bold text-purple-800 mb-2">👩‍🍳 Chef's Suggestion:</h4>
                                        <div className="whitespace-pre-wrap">{recipes[item.productId]}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t mt-6 gap-4">
                        <div className="text-2xl font-bold text-gray-800">
                            Total: <span className="text-green-600">₹{cartTotal}</span>
                        </div>
                        <button
                            onClick={handleFinalPayment}
                            disabled={processingPayment}
                            className={`w-full sm:w-auto px-8 py-3 rounded-lg shadow-lg font-bold text-lg transition-transform transform ${processingPayment
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                                }`}
                        >
                            {processingPayment ? 'Processing Payment...' : 'Proceed to Pay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}