import React, { useState } from "react";

const SignupPage = ({ handlers, error }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [location, setLocation] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handlers.signup(name, email, password, role, location);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium">I am a:</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="customer">Customer</option>
                        <option value="farmer">Farmer</option>
                    </select>
                </div>
                {role === 'farmer' && (
                    <div>
                        <label className="block font-medium">Farm Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., Pollachi"
                            required
                        />
                    </div>
                )}
                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                    Create Account
                </button>
            </form>
            <p className="text-center mt-4">
                Already have an account?{" "}
                <button
                    onClick={() => handlers.navigateTo('login')}
                    className="text-blue-500 hover:underline"
                >
                    Login
                </button>
            </p>
        </div>
    );
};

export default SignupPage;
