import React, { useState } from "react"; // <-- Added useState import
// Remove duplicate and unused imports
// Only keep what you actually use

const LoginPage = ({ handlers, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handlers.login(email, password);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">
                Login to Your Account
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email field */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>

                {/* Password field */}
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>

                {/* Login button */}
                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded-lg 
                               hover:bg-green-700 font-semibold transition-colors"
                >
                    Login
                </button>
            </form>

            {/* Signup redirect */}
            <p className="text-center mt-4 text-gray-600">
                Don't have an account?{" "}
                <button
                    onClick={() => handlers.navigateTo('signup')}
                    className="text-blue-500 hover:underline font-medium"
                >
                    Sign Up
                </button>
            </p>
        </div>
    );
};

export default LoginPage;
