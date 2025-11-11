// controller/userController.js

const User = require("../model/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register / Signup
const signup = async (req, res) => {
    try {
        const { name, email, password, role, farmDetails } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user with the hashed password
        const newUser = new User({
            name,
            email,
            password: hashedPassword, // Store the hashed password
            role,
            farmDetails: role === 'farmer' ? farmDetails : undefined
        });

        await newUser.save();

        // Don't send the password back in the response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ message: "User created successfully", user: userResponse });
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

            // Inside login controller
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                location: user.farmDetails?.location || '' // or however you store it
            }
        };

        // Correct way: Use await and get the secret from environment variables
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // <-- Uses the secure key
            { expiresIn: '1h' }
        );
        
        res.status(200).json({
            message: "Logged in successfully",
            token: token
        });

    } catch (err) {
        // Any error, including one from jwt.sign, will be caught here
        res.status(500).json({ message: "Server error: " + err.message });
    }
};
// Get all users with the role 'farmer'
const getFarmers = async (req, res) => {
    try {
        // Find users with role 'farmer' and exclude their password from the result
        const farmers = await User.find({ role: "farmer" }).select("-password");
        res.status(200).json(farmers);
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};

// Get all users with the role 'customer'
const getCustomers = async (req, res) => {
    try {
        // Find users with role 'customer' and exclude their password
        const customers = await User.find({ role: "customer" }).select("-password");
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ message: "Server error: " + err.message });
    }
};


module.exports = { signup, login, getFarmers, getCustomers };