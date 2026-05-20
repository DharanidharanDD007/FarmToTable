import React, { useState, useEffect } from "react";
import * as reviewApi from "../api/reviews";

const ProductReviewsSection = ({ productId, user }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await reviewApi.getReviews(productId);
            setReviews(data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (expanded) {
            fetchReviews();
        }
    }, [expanded]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await reviewApi.createReview({ productId, rating, comment });
            setComment("");
            setRating(5);
            fetchReviews();
        } catch (error) {
            console.error("Failed to post review:", error);
            alert("Failed to submit review. Make sure you are logged in.");
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1.5 focus:outline-none"
                >
                    💬 {expanded ? "Hide Reviews" : "Show Reviews"} ({reviews.length})
                </button>
                {averageRating && (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        ⭐ {averageRating} / 5
                    </span>
                )}
            </div>

            {expanded && (
                <div className="mt-3 space-y-3">
                    {loading ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">Loading reviews...</p>
                    ) : (
                        <>
                            {reviews.length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">No reviews yet. Be the first!</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {reviews.map((r) => (
                                        <div key={r._id || r.id} className="bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{r.customerName}</span>
                                                <span className="text-amber-500 font-semibold">{"⭐".repeat(r.rating)}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">{r.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {user && user.role === "customer" && (
                                <form onSubmit={handleSubmit} className="bg-green-50/50 dark:bg-green-950/10 p-2.5 rounded-xl border border-green-150 dark:border-green-900/40 mt-2 space-y-2">
                                    <p className="text-xs font-bold text-green-800 dark:text-green-400">Add your review</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Rating:</span>
                                        <select
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                            className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100"
                                        >
                                            {[5, 4, 3, 2, 1].map(n => (
                                                <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Write comment..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="flex-1 text-xs px-2.5 py-1 border border-gray-250 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded-lg text-xs disabled:bg-gray-300 transition-colors"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const ProductsPage = ({ products, handlers, locationFilter }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("default");
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const locations = ['all', ...new Set(products.map(p => p.farmerLocation).filter(Boolean))];
    
    // 1. Filter by location and search term
    let filteredProducts = products.filter(product => {
        const matchesLocation = locationFilter === 'all' || product.farmerLocation === locationFilter;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.farmerName && product.farmerName.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesLocation && matchesSearch;
    });

    // 2. Sort results
    if (sortBy === "price-asc") {
        filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
        filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
    } else if (sortBy === "stock-desc") {
        filteredProducts = [...filteredProducts].sort((a, b) => b.stock - a.stock);
    }

    return (
        <div>
            {/* Search, Filter & Sort Controls */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors duration-300">
                {/* Search Bar */}
                <div className="relative w-full md:w-1/3">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Search harvest or farmer..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters & Sorting */}
                <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
                    {/* Location Filter */}
                    {locations.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location:</span>
                            <select 
                                id="location-filter"
                                className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
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

                    {/* Sort Order */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sort by:</span>
                        <select 
                            id="sort-select"
                            className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="default">Default (Newest)</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="stock-desc">Available Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products List */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-250">No Harvest Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id || product._id} 
                            className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 ${product.stock === 0 ? 'opacity-65' : 'transform hover:-translate-y-1'}`}
                        >
                            <div className="relative">
                                <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-56 object-cover" 
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src='https://placehold.co/600x400/CCCCCC/FFFFFF?text=Image+Not+Found'; 
                                    }} 
                                />
                                {product.stock === 0 ? (
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-xl font-bold backdrop-blur-xs">
                                        Out of Stock
                                    </div>
                                ) : (
                                    <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                        Fresh
                                    </span>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{product.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Farmer: 
                                    <button 
                                        onClick={() => handlers.viewFarmerProfile(product.farmerId)} 
                                        className="text-green-600 dark:text-green-400 hover:underline font-semibold ml-1"
                                    >
                                        {product.farmerName}'s Farm
                                    </button>
                                </p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
                                    Location: <span className="text-gray-800 dark:text-gray-100">{product.farmerLocation || 'Local'}</span>
                                </p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
                                    {product.stock > 0 ? `${product.stock} ${product.unit || 'units'} available` : 'No stock left'}
                                </p>
                                <ProductReviewsSection productId={product.id || product._id} user={currentUser} />
                                <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-2xl font-black text-green-600 dark:text-green-400">
                                        ₹{product.price} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ {product.unit || 'kg'}</span>
                                    </p>
                                    <button 
                                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 transition-colors shadow-md hover:shadow-lg" 
                                        onClick={() => handlers.addToCart(product)}
                                        disabled={product.stock === 0}
                                    >
                                        {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
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
