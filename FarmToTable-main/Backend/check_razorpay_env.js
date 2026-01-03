const dotenv = require("dotenv");
const path = require("path");

// Try to load .env from current directory
const envPath = path.join(__dirname, ".env");
console.log(`Attempting to load .env from: ${envPath}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("❌ Error loading .env file:", result.error);
} else {
    console.log("✅ .env file loaded successfully.");
}

console.log("\nChecking Razorpay Configuration:");
console.log("--------------------------------");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (keyId) {
    console.log("✅ RAZORPAY_KEY_ID: Found");
    // Show first few chars to verify it looks like a key (usually starts with rzp_test_ or rzp_live_)
    console.log(`   Value: ${keyId.substring(0, 8)}...`);
} else {
    console.error("❌ RAZORPAY_KEY_ID: MISSING");
}

if (keySecret) {
    console.log("✅ RAZORPAY_KEY_SECRET: Found");
    console.log("   Value: [HIDDEN]");
} else {
    console.error("❌ RAZORPAY_KEY_SECRET: MISSING");
}

console.log("\nDiagnostics Complete.");
