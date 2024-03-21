const passport = require("passport");
const register = require("./register");
const login = require("./login");

const userRegister = (userRequest, role, res) =>
  register(userRequest, role, res);

const userLogin = (userRequest, role, res) => login(userRequest, role, res);

const userRefreshToken = (refreshToken, res) => refresh(refreshToken, res);

const userAuth = passport.authenticate("jwt", { session: false });

/**
 * Checks if the provided user role is included in the roles list
 * @param {Array} roles - list of accepted roles.
 * @const checkRole
 */
const checkRole = (roles) => (req, res, next) => {
  !roles.includes(req.user.role)
    ? res.status(401).json("Unauthorized")
    : next();
};

/**
 * returns json of user data.
 * @const serializeUser
 */
function serializeUser(user) {
  try {
    // Customize how you want to serialize the user data here
    return {
      id: user.email,
      username: user.username,
      email: user.email,
      // Add more user properties as needed
    };
  } catch (error) {
    console.error("Error while serializing user:", error);
    return null; // Return null in case of an error
  }
}
module.exports = {
  userAuth,
  userLogin,
  userRegister,
  checkRole,
  userRefreshToken,
  serializeUser,
};
