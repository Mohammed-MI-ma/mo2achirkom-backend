const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { SECRET, TOKEN_EXPIRATION } = require("../../../config");
const User = require("../../../models/User");
const { loginSchema } = require("../validate");

const MSG = {
  usernameNotExist:
    "Nom d'utilisateur introuvable. Identifiants de connexion invalides.",
  wrongRole: "Veuillez vous assurer que c'est bien votre identité.",
  loginSuccess: "Vous êtes connecté avec succès.",
  wrongPassword: "Mot de passe incorrect",
  loginError: "Oops ! Quelque chose s'est mal passé",
};

// Function to check if a string is a valid email
function isEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// Function to validate and handle user login
const login = async (userRequest, role, res) => {
  try {
    const loginRequest = await loginSchema.validateAsync(userRequest);

    // Validate user input using Joi schema
    const { username, password } = loginRequest;

    // Find user by email or username
    const user = isEmail(username)
      ? await User.findOne({ email: username })
      : await User.findOne({ username });

    // Check if the user exists
    if (!user) {
      return {
        user: null,
        reason: "username",
        message: MSG.usernameNotExist,
        success: false,
      };
    }

    // Check if the user has the correct role
    if (user.role !== role) {
      return {
        user: null,
        reason: "role",
        message: MSG.wrongRole,
        success: false,
      };
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // create a new user
      const newUser = new User({
        ...user,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        validated: user.validated,
        //partenaire: user.partenaire,
        username: user.username,
        password: null,
        //  annexe: user.annexe,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
      });
      return {
        user: newUser.toObject(),
        message: MSG.loginSuccess,
        success: true,
      };
    } else {
      return {
        reason: "password",
        message: MSG.wrongPassword,
        success: false,
      };
    }
  } catch (err) {
    let errorMsg = MSG.loginError;
    if (err.isJoi === true) {
      err.status = 403;
      errorMsg = err.message;
    }
    return {
      reason: "server",
      message: errorMsg,
      success: false,
    };
  }
};

module.exports = login;
