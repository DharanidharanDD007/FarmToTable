import React from "react";

const ProductsPage = ({ products, handlers, locationFilter }) => {
    const locations = ['all', ...new Set(products.map(p => p.farmerLocation).filter(Boolean))];
    const filteredProducts = locationFilter === 'all' 
        ? products 
        : products.filter(p => p.farmerLocation === locationFilter);

    return (
        <div>
            {/* Header & Location Filter */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Today's Harvest</h2>
                {locations.length > 1 && (
                    <div>
                        <label htmlFor="location-filter" className="text-sm font-medium text-gray-700 mr-2">
                            Filter by Location:
                        </label>
                        <select 
                            id="location-filter"
                            className="p-2 border rounded-lg bg-white"
                            value={locationFilter}
                            onChange={(e) => handlers.handleLocationFilter(e.target.value)}
                        >
                            <option value="all">All Locations</option>
                            {locations.filter(l => l !== 'all').map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Products List */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No Products Found</h3>
                    <p className="text-gray-500 mt-2">There are no products available from this location right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${product.stock === 0 ? 'opacity-50' : 'transform hover:-translate-y-1 transition-transform'}`}
                        >
                            <div className="relative">
                                <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-48 object-cover" 
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src='https://placehold.co/600x400/CCCCCC/FFFFFF?text=Image+Not+Found'; 
                                    }} 
                                />
                                {product.stock === 0 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-bold">
                                        Out of Stock
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-xl font-semibold">{product.name}</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    From: 
                                    <button 
                                        onClick={() => handlers.viewFarmerProfile(product.farmerId)} 
                                        className="text-blue-600 hover:underline ml-1"
                                    >
                                        {product.farmerName}'s Farm
                                    </button>
                                </p>
                                <p className="text-sm font-semibold text-gray-700 mt-2">
                                    {product.stock > 0 ? `${product.stock} available` : 'No stock left'}
                                </p>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-lg font-bold text-green-600">
                                        ₹{product.price} <span className="text-sm font-normal">/ {product.unit}</span>
                                    </p>
                                    <button 
                                        className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 disabled:bg-gray-400" 
                                        onClick={() => handlers.addToCart(product)}
                                        disabled={product.stock === 0}
                                    >
                                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
