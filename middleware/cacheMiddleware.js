// Middleware to cache responses
const cacheMiddleware = async (req, res, next) => {
  // Check if the request is authorized to access the cache
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: "Unauthorized access to cache" });
  }

  const cacheKey = req.originalUrl;
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    res.send(JSON.parse(cachedData));
  } else {
    // If data not found in cache, proceed to next middleware
    next();
  }
};

// Function to check if the request is authorized
const isAuthorized = (req) => {
  // Implement your authorization logic here
  // For example, you might check if the request contains valid credentials
  // Or if the request is coming from an authenticated user
  // This is just a placeholder implementation, replace it with your actual logic
  return true; // Return true for now (assuming all requests are authorized)
};
