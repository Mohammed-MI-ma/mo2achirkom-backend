//___DEPENDECIES
const jwt = require("jsonwebtoken");

const {
  SECRET,
  TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} = require("../config");
const User = require("../models/User");

const generateAccessToken = (user) => {
  const token = jwt.sign(
    {
      user_id: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
    },
    SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );

  return token;
};
const generateResetToken = async (email) => {
  const user = await User.findOne({ email });
  let resetToken;
  if (!user) {
    // User not found, handle this case
    return (resetToken = "");
  }

  // Generate a reset token (use a library like 'crypto' for better randomness)
  resetToken = Math.random().toString(36).slice(2);

  // Set the reset token and expiration timestamp in the user document
  user.resetToken = resetToken;
  user.resetTokenExpiration = new Date(Date.now() + 3600000); // Token expires in 1 hour

  // Save the user document with the reset token
  await user.save();

  return resetToken;
};
const generateRefreshToken = (user) => {
  // Create a new refresh token with the user's information
  const refreshToken = jwt.sign(
    {
      user_id: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
    },
    SECRET, // Use a separate secret for refresh tokens
    { expiresIn: REFRESH_TOKEN_EXPIRATION } // Set a longer expiration time
  );

  return refreshToken;
};

module.exports = {
  generateAccessToken,
  generateResetToken,
  generateRefreshToken,
};
