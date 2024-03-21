const User = require("../models/User");

// Middleware function to check if the user is an admin
const isAdmin = async (req, res, next) => {
  const admin = await User.findOne({ username: req.user });
  if (admin && admin.role === "admin") {
    // User is an admin, allow access to the route
    next();
  } else {
    // User is not an admin, deny access
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required.", success: false });
  }
};
module.exports = isAdmin;
