// model/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "farmer"], required: true },
    farmDetails: {
        name: String,
        location: String,
        bio: String
    }
}, { timestamps: true });

// Add indexes for better query performance (email already has unique index)
userSchema.index({ role: 1 }); // For filtering by role

const User = mongoose.model("User", userSchema);
module.exports = User;