import React, { useState, useEffect } from "react";
import PaymentModal from "../components/PaymentModal";
import { PaymentService } from "../services/PaymentService";
import { CartService } from "../services/CartService";
import callGeminiAPI from "../api/gemini";

export default function CartPage({ user, handlers }) {
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recipes, setRecipes] = useState({}); // Store recipes by productId
    const [generatingRecipeId, setGeneratingRecipeId] = useState(null);

    // Fetch Cart on Mount
    useEffect(() => {
        if (user?.id || user?._id) {
            fetchCart();
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const userId = user.id || user._id;
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
            const userId = user.id || user._id;
            const data = await CartService.updateQuantity(userId, productId, newQuantity);
            setCartItems(data.items);
            setCartTotal(data.totalAmount);
        } catch (error) {
            console.error("Failed to update quantity", error);
        }
    };

    const handleRemove = async (productId) => {
        try {
            const userId = user.id || user._id;
            const data = await CartService.removeFromCart(userId, productId);
            setCartItems(data.items);
            setCartTotal(data.totalAmount);
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    const handleGenerateRecipe = async (item) => {
        setGeneratingRecipeId(item.productId);
        const prompt = `Suggest a simple, delicious recipe using ${item.name}. 
        Format: 
        **Recipe Name**
        *Ingredients*: ...
        *Steps*: ...`;

        const recipe = await callGeminiAPI(prompt, () => { });
        setRecipes(prev => ({ ...prev, [item.productId]: recipe }));
        setGeneratingRecipeId(null);
    };

    const handleFinalPayment = async () => {
        setShowModal(false);
        await PaymentService.checkout({
            cart: cartItems,
            user,
            totalAmount: cartTotal,
            onSuccess: async (data) => {
                alert("Payment Successful! Order ID: " + data.orderId);
                setCartItems([]);
                setCartTotal(0);
                const userId = user.id || user._id;
                await CartService.clearCart(userId);
                handlers.navigateTo("customerOrders");
            },
            onError: (error) => {
                alert("Payment Failed: " + error);
            }
        });
    };

    if (loading) return <div className="text-center p-8">Loading Cart...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Your Shopping Cart</h2>

            {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
            ) : (
                <div className="space-y-6">
                    {cartItems.map((item) => (
                        <div key={item.productId} className="flex flex-col border-b pb-6 last:border-0">
                            {/* Product Row */}
                            <div className="flex items-center gap-6">
                                <img
                                    src={item.image || "https://placehold.co/100"}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded-md shadow-sm"
                                />

                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                                    <p className="text-gray-500 text-sm">Farmer: {item.farmerName || "Local Farm"}</p>
                                    <p className="text-green-600 font-bold mt-1">₹{item.price} / {item.unit}</p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-3 bg-gray-100 px-3 py-1 rounded-full">
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-200 font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="font-semibold w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-200 font-bold"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <p className="font-bold text-lg">₹{item.subtotal}</p>
                                </div>

                                <button
                                    onClick={() => handleRemove(item.productId)}
                                    className="text-red-500 hover:text-red-700 p-2"
                                    title="Remove Item"
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* AI Recipe Section */}
                            <div className="mt-4 ml-32">
                                {!recipes[item.productId] ? (
                                    <button
                                        onClick={() => handleGenerateRecipe(item)}
                                        disabled={generatingRecipeId === item.productId}
                                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-2"
                                    >
                                        ✨ {generatingRecipeId === item.productId ? "Generating Recipe..." : "Suggest a Recipe"}
                                    </button>
                                ) : (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-gray-700 mt-2 animate-fade-in">
                                        <h4 className="font-bold text-purple-800 mb-2">👩‍🍳 Chef's Suggestion:</h4>
                                        <div className="whitespace-pre-wrap">{recipes[item.productId]}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Cart Footer */}
                    <div className="flex justify-between items-center pt-6 border-t mt-6">
                        <div className="text-2xl font-bold text-gray-800">
                            Total: <span className="text-green-600">₹{cartTotal}</span>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 shadow-lg font-bold text-lg transition-transform transform hover:scale-105"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}

            {showModal && (
                <PaymentModal
                    totalAmount={cartTotal}
                    onConfirm={handleFinalPayment}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
