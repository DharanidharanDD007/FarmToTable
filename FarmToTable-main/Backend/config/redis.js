const { Redis } = require("@upstash/redis");
const dotenv = require("dotenv");

dotenv.config();

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = Redis.fromEnv();
    console.log("✅ Upstash Redis client initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Upstash Redis client:", error.message);
  }
} else {
  console.log("⚠️ Upstash Redis environment variables missing. Caching will be bypassed.");
}

module.exports = redis;
