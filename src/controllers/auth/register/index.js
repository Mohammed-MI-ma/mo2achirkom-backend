const bcrypt = require("bcryptjs");
const {
  validateEmail,
  validateUsername,
  signupSchema,
  validatePasswordValidation,
} = require("../validate");
const User = require("../../../models/User");

const MSG = {
  usernameExists: "Nom d'utilisateur déjà pris.",
  emailExists: "L'adresse e-mail est déjà utilisée.",
  signupSuccess: "Vous êtes inscrit avec succès.",
  signupError: "Impossible de créer votre compte.",
  passwordDontMatch: "Les mots de passe ne correspondent pas",
};

/**
 * Registers a new user.
 * @param {Object} userRequest - The user data.
 * @param {string} role - The role of the user.
 * @returns {Object} - An object containing the registration result.
 */
const register = async (userRequest, role) => {
  try {
    // Validate user data
    const signupRequest = await signupSchema.validateAsync(userRequest);

    // Validate password
    const passwordDontMatch = await validatePasswordValidation(
      signupRequest.password,
      signupRequest.passwordValidation
    );
    if (!passwordDontMatch) {
      return { user: null, message: MSG.passwordDontMatch, success: false };
    }

    // Check if username is available
    const usernameNotTaken = await validateUsername(signupRequest.username);
    if (!usernameNotTaken) {
      return { user: null, message: MSG.usernameExists, success: false };
    }

    // Check if email is available
    const emailNotRegistered = await validateEmail(signupRequest.email);
    if (!emailNotRegistered) {
      return { user: null, message: MSG.emailExists, success: false };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(signupRequest.password, 12);

    // Create user
    const newUser = new User({
      ...signupRequest,
      password: passwordHash,
      role,
    });
    await newUser.save();

    // Return success response
    return {
      user: newUser.toObject(),
      message: MSG.signupSuccess,
      success: true,
    };
  } catch (error) {
    let errorMsg = MSG.signupError;
    if (error.isJoi === true) {
      errorMsg = error.message;
    }
    return { user: null, message: errorMsg, success: false };
  }
};

module.exports = register;
