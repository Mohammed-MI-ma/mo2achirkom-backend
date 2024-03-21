const router = require("express").Router();
const ROLE = require("../config/roles");
const { userAuth, checkRole, serializeUser } = require("../controllers/auth");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");

// Middleware to secure all routes with API key authentication
router.use(apiKeyMiddleware);

// Base route to check if API is running
router.get("/", (req, res) => {
  res.send("API is running...");
});

// Authentication Router Middleware
// Routes related to user authentication
router.use("/auth", require("./auth"));

// Route for application
// Routes related to the main application functionality
router.use("/application", require("./application"));

// Protected route for users' profiles
// Requires user authentication and role authorization
router.get("/profile", userAuth, checkRole([ROLE.user]), async (req, res) => {
  // Responds with user's profile information
  res.status(200).json({ type: ROLE.user, user: serializeUser(req.user) });
});

module.exports = router;
