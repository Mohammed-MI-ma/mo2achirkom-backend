// middlewares/resetPasswordMiddleware.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
const crypto = require("crypto");
const ResetToken = require("../models/ResetToken");
// Function to generate a reset token
const generateResetToken = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate a reset token (use a library like 'crypto' for better randomness)
  const resetToken = Math.random().toString(36).slice(2);

  // Set the reset token and expiration timestamp in the user document
  user.resetToken = resetToken;
  user.resetTokenExpiration = new Date(Date.now() + 3600000); // Token expires in 1 hour

  // Save the user document with the reset token
  await user.save();

  return resetToken;
};
// Function to validate a reset token
// middlewares/resetPasswordMiddleware.js

// Function to validate a reset token
const isValidResetToken = async (email, token) => {
  const user = await ResetToken.findOne({ email })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!user || !user.token || !user.expiration) {
    return false;
  }
  // Check if the provided token matches the stored token and if it's not expired
  const tokenIsValid = token === user.token && user.expiration > new Date();
  console.log("tokenIsValid", token, user.token);
  return tokenIsValid;
};

// Function to update a user's password
// middlewares/resetPasswordMiddleware.js

// Function to update a user's password
const updatePassword = async (email, newPassword) => {
  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }
  // Hash the new password before saving it
  const hashedPassword = await bcrypt.hash(newPassword, 10); // Use an appropriate salt rounds value

  // Update the user's password and clear the reset token fields
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiration = undefined;

  // Save the updated user document
  await user.save();
};

module.exports = {
  generateResetToken,
  isValidResetToken,
  updatePassword,
};
