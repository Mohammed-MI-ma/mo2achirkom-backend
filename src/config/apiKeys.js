// config/apiKeys.js
const generateApiKey = require("../utils/apiKeyGenerator");

const apiKeys = {
  apiKey1: generateApiKey(),
  apiKey2: generateApiKey(),
  "43f773dd-c02d-4f19-9393-830d9284d4f6": true,
  // Add more keys as needed
};

module.exports = apiKeys;
