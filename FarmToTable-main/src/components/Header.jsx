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

    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        return document.documentElement.classList.contains("dark") || 
               localStorage.getItem("theme") === "dark";
    });

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to home after logout
    };

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                
                {/* Logo & Title - Using Link for better semantics */}
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <LogoIcon />
                    <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">FarmFresh Direct</h1>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link 
                        to="/" 
                        className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
                    >
                        Products
                    </Link>

                    {user?.role === 'customer' && (
                        <>
                            <Link 
                                to="/customerOrders" 
                                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
                            >
                                My Orders
                            </Link>
                            <Link 
                                to="/cart" 
                                className="relative text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            >
                                <ShoppingCartIcon />
                                {cart.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                    </span>
                                )}
                            </Link>
                        </>
                    )}

                    {user?.role === 'farmer' && (
                        <Link 
                            to="/farmerDashboard" 
                            className="relative text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        >
                            <DashboardIcon />
                            {newOrdersCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                    {newOrdersCount}
                                </span>
                            )}
                        </Link>
                    )}
                </nav>

                {/* User Section & Theme Toggle */}
                <div className="flex items-center space-x-4">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-750 transition-colors text-lg"
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? "☀️" : "🌙"}
                    </button>

                    {user ? (
                        <>
                            <span className="text-gray-750 dark:text-gray-250 hidden sm:inline font-medium">
                                Welcome, {user.name}!
                            </span>
                            <Link 
                                to="/profile" 
                                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Profile"
                            >
                                <UserProfileIcon />
                            </Link>
                            <button 
                                className="bg-red-500 text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold hover:bg-red-650 transition-colors" 
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link 
                                to="/login"
                                className="bg-green-600 text-white px-4.5 py-2 rounded-xl text-sm hover:bg-green-700 transition-colors font-bold shadow-sm"
                            >
                                Login
                            </Link>
                            <Link 
                                to="/signup"
                                className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4.5 py-2 rounded-xl text-sm hover:bg-gray-350 dark:hover:bg-gray-700 transition-colors font-bold shadow-sm"
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