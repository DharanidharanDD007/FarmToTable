// controller/userController.js
const User = require("../model/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register / Signup
const signup = async (req, res) => {
    try {
        const { name, email, password, role, farmDetails } = req.body;

        // Basic validation
        if (!email || !password || !name || !role) {
            return res.status(400).json({ message: "All fields (name, email, password, role) are required." });
        }

        const lowerEmail = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: lowerEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            name,
            email: lowerEmail,
            password: hashedPassword,
            role,
            farmDetails: role === 'farmer' ? farmDetails : undefined
        });

        await newUser.save();

        // Don't send the password back
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ message: "User created successfully", user: userResponse });
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const lowerEmail = email.toLowerCase();

        const user = await User.findOne({ email: lowerEmail });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // Standardize ID
        const userId = user._id.toString();

        // Create Token Payload (Adding 'id' alias for compatibility)
        const payload = {
            user: {
                id: userId,  // ✅ Added 'id' so other controllers can use req.user.id
                _id: userId,
                role: user.role,
                name: user.name,
                location: user.farmDetails?.location || ''
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Logged in successfully",
            token: token,
            user: {
                id: userId,
                _id: userId,
                name: user.name,
                email: user.email,
                role: user.role,
                farmDetails: user.farmDetails
            }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};

// Get Farmers
const getFarmers = async (req, res) => {
    try {
        const farmers = await User.find({ role: "farmer" }).select("-password");
        res.status(200).json(farmers);
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};

// Get Customers
const getCustomers = async (req, res) => {
    try {
        const customers = await User.find({ role: "customer" }).select("-password");
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};

// ✅ CRITICAL: Ensure all functions are exported in this object
module.exports = { signup, login, getFarmers, getCustomers };