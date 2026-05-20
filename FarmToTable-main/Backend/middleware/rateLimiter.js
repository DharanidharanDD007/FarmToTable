const ratelimit = require("../config/upstash.js");

const rateLimit = async (req, res, next) => {
  try {
    const { success } = await ratelimit.limit(req.ip); // ✅ per IP
    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later!",
      });
    }
    next();
  } catch (error) {
    console.error("Rate limit error (bypassing for stability):", error.message || error);
    next(); // Fail open in local development or if Redis is down
  }
};

module.exports = rateLimit;
