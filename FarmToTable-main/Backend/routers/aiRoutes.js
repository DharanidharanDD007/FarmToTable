// routers/aiRoutes.js

const express = require("express");
const aiController = require("../controller/aiController.js");
const rateLimit = require("../middleware/rateLimiter.js");

const router = express.Router();

// Route to get AI recipe suggestions (Protected by IP Rate Limiter to prevent API abuse)
router.post("/recommend-recipe", rateLimit, aiController.recommendRecipe);

module.exports = router;
