const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");
const dotenv = require("dotenv");

dotenv.config();

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(), // ✅ correct class name
  limiter: Ratelimit.slidingWindow(10, "20 s"), // 10 requests per 20 seconds
  analytics: true, // optional: helps Upstash show stats in dashboard
});

module.exports = ratelimit;
