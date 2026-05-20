import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    
    // Google Signup role selection
    const [googleCred, setGoogleCred] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState('customer');
    const [farmLocation, setFarmLocation] = useState('');

    const { signup, googleLogin, error: authError } = useAuth();
    const navigate = useNavigate();

    // Reset error when user types
    useEffect(() => {
        setFormError('');
    }, [name, email, password, location]);

    // Handle traditional form signup
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client validation
        if (!name.trim() || !email.trim() || !password) {
            setFormError("All core fields are required.");
            return;
        }
        if (password.length < 6) {
            setFormError("Password must be at least 6 characters.");
            return;
        }
        if (role === 'farmer' && !location.trim()) {
            setFormError("Farm location is required for farmers.");
            return;
        }

        setLoading(true);
        setFormError('');

        try {
            const result = await signup(name, email, password, role, location);
            if (result.success) {
                alert("Account created successfully! Please sign in.");
                navigate('/login');
            } else {
                setFormError(result.message || "Signup failed. Please try again.");
            }
        } catch (err) {
            setFormError("Server error during registration.");
        } finally {
            setLoading(false);
        }
    };

    // Google Callback
    const handleGoogleCallback = async (response) => {
        setLoading(true);
        setFormError('');
        const credential = response.credential;
        setGoogleCred(credential);

        try {
            const result = await googleLogin({ credential });
            if (result.success) {
                if (result.registrationRequired) {
                    setShowRoleModal(true);
                } else {
                    navigate('/');
                }
            } else {
                setFormError(result.message || "Google authentication failed.");
            }
        } catch (err) {
            setFormError("Failed to authenticate with Google.");
        } finally {
            setLoading(false);
        }
    };

    // Complete Google registration with role
    const handleCompleteRegistration = async (e) => {
        e.preventDefault();
        if (selectedRole === 'farmer' && !farmLocation.trim()) {
            setFormError("Farm location is required for farmers.");
            return;
        }

        setLoading(true);
        setFormError('');
        setShowRoleModal(false);

        try {
            const result = await googleLogin({
                credential: googleCred,
                role: selectedRole,
                farmDetails: selectedRole === 'farmer' ? { location: farmLocation, bio: '' } : undefined
            });

            if (result.success) {
                navigate('/');
            } else {
                setFormError(result.message || "Failed to complete Google registration.");
            }
        } catch (err) {
            setFormError("Server error during registration completion.");
        } finally {
            setLoading(false);
        }
    };

    // Initialize Google Button with script polling
    useEffect(() => {
        let attempts = 0;
        const initializeGoogleBtn = () => {
            if (typeof window.google !== 'undefined' && window.google.accounts) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-id',
                        callback: handleGoogleCallback,
                        auto_select: false
                    });
                    
                    const btnContainer = document.getElementById("googleSignupBtn");
                    if (btnContainer) {
                        window.google.accounts.id.renderButton(
                            btnContainer,
                            { 
                                theme: "filled_blue", 
                                size: "large", 
                                text: "signup_with", 
                                shape: "rectangular", 
                                width: "100%" 
                            }
                        );
                        return true; // render success
                    }
                } catch (err) {
                    console.error("Error rendering Google Signup Button:", err);
                }
            }
            return false;
        };

        // Try immediately
        if (initializeGoogleBtn()) return;

        // Otherwise poll every 250ms up to 20 times (5 seconds)
        const interval = setInterval(() => {
            attempts++;
            if (initializeGoogleBtn() || attempts > 20) {
                clearInterval(interval);
            }
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-tr from-emerald-50 via-green-50 to-emerald-100 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-green-100 dark:border-gray-800 transition-all duration-300 transform hover:scale-[1.01]">
                
                {/* Header Title */}
                <div className="text-center">
                    <span className="inline-block p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 mb-3 text-3xl">
                        🌾
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Join FarmToTable as a Customer or Seller.
                    </p>
                </div>

                {/* Error Box */}
                {(formError || authError) && (
                    <div className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-xl text-sm transition-all">
                        <div className="flex">
                            <span className="mr-2">⚠️</span>
                            <p className="font-medium">{formError || authError}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
                                placeholder="Min. 6 characters"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Account Type
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all duration-200"
                            >
                                <option value="customer">Customer (Buy Fresh Produce)</option>
                                <option value="farmer">Farmer (Sell Fresh Produce)</option>
                            </select>
                        </div>

                        {role === 'farmer' && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Farm Location
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all duration-200"
                                    placeholder="e.g. Ooty, Tamil Nadu"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-green-200 dark:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Account...
                            </span>
                        ) : (
                            "Sign Up"
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                            Or register with
                        </span>
                    </div>
                </div>

                {/* Google Sign-Up Button Wrapper */}
                <div className="w-full flex justify-center">
                    <div id="googleSignupBtn" className="w-full min-h-[44px]"></div>
                </div>

                {/* Login Switch */}
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Already registered?{" "}
                    <button 
                        onClick={() => navigate('/login')} 
                        className="text-green-600 dark:text-green-400 hover:underline font-bold"
                    >
                        Sign in instead
                    </button>
                </p>
            </div>

            {/* Google Signup Role Selection Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-green-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <span className="text-4xl">🌾</span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Complete Google Sign-Up</h3>
                            <p className="text-sm text-gray-500 mt-1">Please select your account type to continue.</p>
                        </div>
                        
                        <form onSubmit={handleCompleteRegistration} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    I am a:
                                </label>
                                <select 
                                    value={selectedRole} 
                                    onChange={(e) => setSelectedRole(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                >
                                    <option value="customer">Customer (Buy Fresh Produce)</option>
                                    <option value="farmer">Farmer (Sell Fresh Produce)</option>
                                </select>
                            </div>

                            {selectedRole === 'farmer' && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Farm Location
                                    </label>
                                    <input 
                                        type="text" 
                                        value={farmLocation} 
                                        onChange={(e) => setFarmLocation(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="e.g. Pollachi, Tamil Nadu"
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl disabled:opacity-50 transition-all duration-200 shadow-lg shadow-green-200 dark:shadow-none mt-6"
                            >
                                Complete Registration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignupPage;