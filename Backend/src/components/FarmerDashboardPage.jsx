import { useState } from "react";
import EditIcon from "../icons/EditIcon";
import TrashIcon from "../icons/TrashIcon";
import ProductFormModal from "./ProductFormModal";

const FarmerDashboardPage = ({ user, products, handlers }) => {
    const [isFormVisible, setFormVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormVisible(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormVisible(true);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Farmer Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div
                    className="bg-blue-100 text-blue-800 p-6 rounded-lg hover:bg-blue-200 cursor-pointer"
                    onClick={() => handlers.navigateTo("farmerOrders")}
                >
                    <h3 className="text-xl font-bold">View My Orders</h3>
                    <p className="mt-1">See incoming orders from customers.</p>
                </div>

                <div
                    className="bg-green-100 text-green-800 p-6 rounded-lg hover:bg-green-200 cursor-pointer"
                    onClick={handleAddNew}
                >
                    <h3 className="text-xl font-bold">Manage My Products</h3>
                    <p className="mt-1">Add new items or edit existing ones.</p>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Your Current Listings</h3>
                <div className="space-y-4">
                    {(() => {
                        const userId = user.id || user._id;
                        return products.filter((p) => p.farmerId === userId).length > 0 ? (
                            products
                                .filter((p) => p.farmerId === userId)
                                .map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-bold">
                                                {p.name}{" "}
                                                <span className="font-normal text-gray-600">
                                                    ({p.stock} in stock)
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                ₹{p.price} / {p.unit}
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => handlers.requestDeleteProduct(p.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <p className="text-gray-500">
                                You have no products listed. Click 'Manage My Products' to add one!
                            </p>
                        );
                    })()}
                </div>
            </div>


            {/* Recipe Generator for Farmer */}
            <div className="mt-8 border-t pt-6">
                <button
                    onClick={async () => {
                        const result = await handlers.generateRecipe();
                        if (result) alert("Recipe Idea:\n" + result);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-purple-700"
                >
                    ✨ Get Recipe Ideas from My Products
                </button>
            </div>

            {
                isFormVisible && (
                    <ProductFormModal
                        product={editingProduct}
                        handlers={handlers}
                        onClose={() => setFormVisible(false)}
                    />
                )
            }
        </div >
    );
};

export default FarmerDashboardPage;
