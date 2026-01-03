import React, { useState } from "react"; // <-- Added useState import
import SparklesIcon from "../icons/SparklesIcon"; // Only keep icons you actually use

const ProductFormModal = ({ product, handlers, onClose }) => {
    const [name, setName] = useState(product?.name || '');
    const [desc, setDesc] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price || '');
    const [unit, setUnit] = useState(product?.unit || 'kg');
    const [image, setImage] = useState(product?.image || '');
    const [stock, setStock] = useState(product?.stock || '');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        handlers.saveProduct({
            id: product?.id,
            name,
            description: desc,
            price,
            unit,
            image,
            stock
        });
        onClose();
    };

    const handleGenerateDesc = async () => {
        setIsGenerating(true);
        const result = await handlers.generateDescription(name);
        setDesc(result);
        setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h3 className="text-2xl font-semibold mb-4">
                    {product ? 'Edit Product' : 'Add a New Product'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Product Name */}
                    <div>
                        <label className="block">Product Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    {/* Description with auto-generate */}
                    <div>
                        <label className="block">Description</label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border rounded-lg"
                        ></textarea>
                        <button
                            type="button"
                            onClick={handleGenerateDesc}
                            disabled={!name || isGenerating}
                            className="text-sm mt-1 flex items-center gap-1 text-purple-600 disabled:text-gray-400"
                        >
                            <SparklesIcon />
                            {isGenerating ? 'Generating...' : 'Auto-generate'}
                        </button>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block">Image URL</label>
                        <input
                            type="url"
                            value={image}
                            onChange={e => setImage(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    {/* Price & Unit */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label>Unit</label>
                            <select
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                            >
                                <option value="kg">per Kg</option>
                                <option value="bunch">per Bunch</option>
                                <option value="piece">per Piece</option>
                            </select>
                        </div>
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block">Total Quantity in Stock</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={e => setStock(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                            placeholder="e.g., 50"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            Save Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;
