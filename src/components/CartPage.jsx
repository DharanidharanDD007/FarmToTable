import { useState } from "react";
import PlusIcon from "../icons/PlusIcon";
import MinusIcon from "../icons/MinusIcon";
import TrashIcon from "../icons/TrashIcon";
import SparklesIcon from "../icons/SparklesIcon";

const CartPage = ({ cart, handlers }) => {
    const [recipeIdeas, setRecipeIdeas] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const result = await handlers.generateRecipe();
        setRecipeIdeas(result);
        setIsGenerating(false);
    };

    const totalPrice = cart
        .reduce((total, item) => total + item.price * item.quantity, 0)
        .toFixed(2);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
                Your Shopping Cart
            </h2>

            {cart.length === 0 ? (
                <p className="text-gray-500">
                    Your cart is empty. Add some fresh produce!
                </p>
            ) : (
                <div>
                    {/* Cart Items */}
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center border-b py-4"
                            >
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 object-cover rounded-md"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src =
                                                "https://placehold.co/100x100/CCCCCC/FFFFFF?text=Img";
                                        }}
                                    />
                                    <div>
                                        <p className="font-semibold text-lg">{item.name}</p>
                                        <p className="text-sm text-gray-500">
                                            ₹{item.price} / {item.unit}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center border rounded-lg">
                                        <button
                                            onClick={() =>
                                                handlers.updateCartQuantity(item.id, -1)
                                            }
                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                        >
                                            <MinusIcon />
                                        </button>
                                        <span className="px-4 py-1 font-bold">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() =>
                                                handlers.updateCartQuantity(item.id, 1)
                                            }
                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                        >
                                            <PlusIcon />
                                        </button>
                                    </div>

                                    {/* Price */}
                                    <p className="font-bold w-20 text-right">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </p>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handlers.removeFromCart(item.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total & Checkout */}
                    <div className="mt-8 text-right">
                        <p className="text-2xl font-bold">Total: ₹{totalPrice}</p>
                        <button
                            onClick={handlers.checkout}
                            className="mt-4 w-full md:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700"
                        >
                            Proceed to Checkout
                        </button>
                    </div>

                    {/* Recipe Generator */}
                    <div className="mt-8 border-t pt-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-300"
                        >
                            <SparklesIcon />
                            {isGenerating ? "Generating Ideas..." : "✨ Get Recipe Ideas"}
                        </button>

                        {recipeIdeas && (
                            <div className="mt-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h3 className="text-xl font-semibold text-purple-800 mb-2">
                                    Recipe Suggestion
                                </h3>
                                <pre className="whitespace-pre-wrap font-sans text-gray-700">
                                    {recipeIdeas}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
