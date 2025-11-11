import React from "react";
import LogoIcon from "../icons/LogoIcon";
import ShoppingCartIcon from "../icons/ShoppingCartIcon";
import DashboardIcon from "../icons/DashboardIcon";
import UserProfileIcon from "../icons/UserProfileIcon";
// ⚠️ You imported these but they are not used here → remove them unless you plan to add them in UI
// import PlusIcon from "../icons/PlusIcon";
// import MinusIcon from "../icons/MinusIcon";
// import TrashIcon from "../icons/TrashIcon";
// import SparklesIcon from "../icons/SparklesIcon";
// import EditIcon from "../icons/EditIcon";

const Header = ({ user, cart, handlers, newOrdersCount }) => (
    <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            
            {/* Logo & Title */}
            <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={handlers.goToProducts}
            >
                <LogoIcon />
                <h1 className="text-2xl font-bold text-green-700">FarmFresh Direct</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
                <button 
                    className="text-gray-600 hover:text-green-600" 
                    onClick={handlers.goToProducts}
                >
                    Products
                </button>

                {user?.role === 'customer' && (
                    <>
                        <button 
                            className="text-gray-600 hover:text-green-600" 
                            onClick={() => handlers.navigateTo('customerOrders')}
                        >
                            My Orders
                        </button>
                        <button 
                            className="relative text-gray-600 hover:text-green-600" 
                            onClick={() => handlers.navigateTo('cart')}
                        >
                            <ShoppingCartIcon />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </>
                )}

                {user?.role === 'farmer' && (
                    <button 
                        className="relative text-gray-600 hover:text-green-600" 
                        onClick={() => handlers.navigateTo('farmerDashboard')}
                    >
                        <DashboardIcon />
                        {newOrdersCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {newOrdersCount}
                            </span>
                        )}
                    </button>
                )}
            </nav>

            {/* User Section */}
            <div className="flex items-center space-x-3">
                {user ? (
                    <>
                        <span className="text-gray-700 hidden sm:inline">Welcome, {user.name}!</span>
                        <button 
                            onClick={() => handlers.navigateTo('profile')} 
                            className="text-gray-600 hover:text-green-600"
                        >
                            <UserProfileIcon />
                        </button>
                        <button 
                            className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600" 
                            onClick={handlers.logout}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700" 
                            onClick={() => handlers.navigateTo('login')}
                        >
                            Login
                        </button>
                        <button 
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300" 
                            onClick={() => handlers.navigateTo('signup')}
                        >
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </div>
    </header>
);

export default Header;
