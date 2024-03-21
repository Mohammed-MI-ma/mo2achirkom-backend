const Redis = require("ioredis");
const redis = new Redis(); // Initialize ioredis client

// Redis caching middleware
const cacheImagesByKeyword = async (req, res, next) => {
  try {
    const keyword = req.params.keyword;

    const cachedImages = await redis.getBuffer(keyword); // Retrieve binary data from Redis

    if (cachedImages) {
      // If images found in cache, return them
      return res.status(200).send(cachedImages); // Return binary data directly
    }

    // If images not found in cache, proceed to controller
    next();
  } catch (error) {
    console.error("Redis error:", error);
    next(); // Proceed to controller if there's an error with Redis
  }
};
module.exports = cacheImagesByKeyword;
