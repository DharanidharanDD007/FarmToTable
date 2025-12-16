import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Login to Your Account</h2>
            {authError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {authError}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-2 font-medium">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">Login</button>
            </form>
            <p className="text-center mt-4 text-gray-600">
                Don't have an account? <button onClick={() => navigate('/signup')} className="text-blue-500 hover:underline">Sign Up</button>
            </p>
        </div>
    );
};

export default LoginPage;