const express = require("express");
const Redis = require("ioredis");
const router = express.Router();

const redisClient = new Redis(); // Connect to Redis server

// Middleware to cache responses
const cacheMiddleware = async (req, res, next) => {
  const cacheKey = req.originalUrl;
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    res.send(JSON.parse(cachedData));
  } else {
    // If data not found in cache, proceed to next middleware
    next();
  }
};

// Route to fetch data and cache it
router.get("/", cacheMiddleware, async (req, res) => {
  // Fetch data from the original source (e.g., database)
  const data = await fetchDataFromOriginalSource();
  // Cache the data in Redis
  await redisClient.set(req.originalUrl, JSON.stringify(data));
  res.send(data);
});

// Function to fetch data from original source
async function fetchDataFromOriginalSource() {
  // Simulated data fetching from database or API
  return { message: "Data from original source" };
}

module.exports = router;
