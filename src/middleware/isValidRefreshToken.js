const User = require("../models/User"); // Import your User model here
const jwt = require("jsonwebtoken");
const { SECRET } = require("../config");

const isValidRefreshToken = async (refreshToken) => {
  try {
    // Verify the refresh token using a secret key (make sure to use your actual secret key)
    const decoded = jwt.verify(refreshToken, SECRET);

    // Check if the decoded token has the expected properties (e.g., userId)
    if (!decoded.userId) {
      return false;
    }

    // Check if the refresh token exists in the user's record in the database
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return false;
    }

    // Check if the refresh token has expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp <= currentTimestamp) {
      return false;
    }

    // If all checks pass, the refresh token is valid
    return true;
  } catch (error) {
    // Any error during token verification means the token is invalid
    return false;
  }
};

module.exports = isValidRefreshToken;
