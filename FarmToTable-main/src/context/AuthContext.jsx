import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for logged-in user on app start
    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // If stored data has { user, token }, set user. Otherwise set parsed data itself.
                setUser(parsed.user || parsed); 
            } catch (err) {
                console.error("Failed to parse user data", err);
                localStorage.removeItem('currentUser');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            const data = await authApi.login(email, password);
            
            // Structure to save: includes token and user info
            const storageData = {
                user: data.user,
                token: data.token
            };
            
            setUser(data.user);
            localStorage.setItem('currentUser', JSON.stringify(storageData));
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed";
            setError(msg);
            return { success: false, message: msg };
        }
    };

    const signup = async (name, email, password, role, location) => {
        setError(null);
        try {
            const farmDetails = role === 'farmer' ? { location, bio: '' } : undefined;
            await authApi.signup({ name, email, password, role, farmDetails });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Signup failed";
            setError(msg);
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;