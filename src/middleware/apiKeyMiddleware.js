// middlewares/apiKeyMiddleware.js

const apiKeys = require("../config/apiKeys");

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["api-key"];

  console.log("Received API key:", apiKey);
  if (!apiKey || apiKey !== "43f773dd-c02d-4f19-9393-830d9284d4f6") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // If the API key is valid, continue to the next middleware
  next();
};

module.exports = apiKeyMiddleware;
