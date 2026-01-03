import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoIcon from "../icons/LogoIcon";
import ShoppingCartIcon from "../icons/ShoppingCartIcon";
import DashboardIcon from "../icons/DashboardIcon";
import UserProfileIcon from "../icons/UserProfileIcon";

const Header = ({ cart = [], newOrdersCount = 0 }) => {
    // 1. Use Context instead of props for Auth
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to home after logout
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                
                {/* Logo & Title - Using Link for better semantics */}
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <LogoIcon />
                    <h1 className="text-2xl font-bold text-green-700">FarmFresh Direct</h1>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link 
                        to="/" 
                        className="text-gray-600 hover:text-green-600 font-medium"
                    >
                        Products
                    </Link>

                    {user?.role === 'customer' && (
                        <>
                            <Link 
                                to="/customerOrders" 
                                className="text-gray-600 hover:text-green-600 font-medium"
                            >
                                My Orders
                            </Link>
                            <Link 
                                to="/cart" 
                                className="relative text-gray-600 hover:text-green-600"
                            >
                                <ShoppingCartIcon />
                                {cart.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                    </span>
                                )}
                            </Link>
                        </>
                    )}

                    {user?.role === 'farmer' && (
                        <Link 
                            to="/farmerDashboard" 
                            className="relative text-gray-600 hover:text-green-600"
                        >
                            <DashboardIcon />
                            {newOrdersCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {newOrdersCount}
                                </span>
                            )}
                        </Link>
                    )}
                </nav>

                {/* User Section */}
                <div className="flex items-center space-x-3">
                    {user ? (
                        <>
                            <span className="text-gray-700 hidden sm:inline font-medium">Welcome, {user.name}!</span>
                            <Link 
                                to="/profile" 
                                className="text-gray-600 hover:text-green-600"
                                title="Profile"
                            >
                                <UserProfileIcon />
                            </Link>
                            <button 
                                className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 transition-colors" 
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link 
                                to="/login"
                                className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-green-700 transition-colors font-medium"
                            >
                                Login
                            </Link>
                            <Link 
                                to="/signup"
                                className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-full text-sm hover:bg-gray-300 transition-colors font-medium"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;