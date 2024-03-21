// apiKeyGenerator.js

const { v4: uuidv4 } = require("uuid");

/**
 * Generates a unique API key using UUID v4.
 * @returns {string} - The generated API key.
 */
function generateApiKey() {
  return uuidv4();
}

module.exports = generateApiKey;
