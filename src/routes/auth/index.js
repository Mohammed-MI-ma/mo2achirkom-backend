//__DEPENDENCIES
const router = require("express").Router();
const { validationResult } = require("express-validator"); // Import the 'check' function
//___MIDDLEWARES
//2
const {
  isValidResetToken,
  updatePassword,
} = require("../../middleware/resetPasswordMiddleware");
//3
const validateAccessToken = require("../../middleware/validateAccessToken");
//4
const isValidRefreshToken = require("../../middleware/isValidRefreshToken");

//___FUNCTIONS
const {
  generateAccessToken,
  generateResetToken,
  generateRefreshToken,
} = require("../../utils/tokenUtils");

//___CONST
const { ANNEXE } = require("../../config/roles");

//___CONTROLLERS
const {
  userLogin,
  userRegister,
  serializeUser,
} = require("../../controllers/auth");

const { notifyUserInApp } = require("../../utils/notifications");

//___MODELS
const ResetToken = require("../../models/ResetToken");
const User = require("../../models/User");
const isAdmin = require("../../middleware/isValidAdmin");

/**
 * @swagger
 * /:
 *   get:
 *     summary: Check if the authentication service is running
 *     description: Endpoint to verify the status of the authentication service.
 *     responses:
 *       '200':
 *         description: Authentication service is running.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Auth service running...
 */
router.get("/", async (req, res) => {
  return res.send("Auth service running...");
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with the provided user data. This endpoint requires an API key to be included in the request header as "api-key".
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       '400':
 *         description: Bad request or user registration failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/signup", async (req, res) => {
  const { role, ...userData } = req.body;

  // Validate the role (ensure it's one of the allowed roles)
  //if (!["user", "admin"].includes(role)) {
  if (role !== "user") {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await userRegister(userData, role, res);
    // Check if user registration was successful
    if (!user?.user) {
      return res.status(400).json(user);
    }

    // Create a sanitized user object for the response
    const sanitizedUser = {
      id: user?.user._id,
      username: user?.user.username,
      email: user?.user.email,
      // Add any other user properties you want to include in the response
    };

    return res.status(200).json({
      user: sanitizedUser,
      message: "L'utilisateur a été enregistré avec succès.",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
});

//__User Login Route
router.post("/login", async (req, res) => {
  const { role, ...userData } = req.body;

  // Validate the role (ensure it's one of the allowed roles)
  if (!["user", "admin"].includes(role)) {
    return res.status(200).json({ user: null, message: "Invalid role" });
  }
  try {
    const user = await userLogin(userData, role, res);
    if (!user?.user) {
      return res.status(200).json(user);
    }
    // Generate an access token and a refresh token
    const accessToken = generateAccessToken(user.user); // Assuming you have a function to generate access tokens
    const refreshToken = generateRefreshToken(user.user); // Assuming you have a function to generate refresh tokens

    // Create a sanitized user object for the response
    const sanitizedUser = {
      id: user?.user._id,
      role: user?.user.role,
      username: user?.user.username,
      email: user?.user.email,
      name: user?.user.name,
      lastname: user?.user.lastname,
      // partenaire: user?.user.partenaire,
      validated: user?.user.validated,
      //  annexe: user?.user.annexe,
      createdAt: user?.user.createdAt,
      updatedAt: user?.user.updatedAt,

      // Add any other user properties you want to include in the response
    };
    console.log("sanitizedUser", user);
    return res.status(200).json({
      user: sanitizedUser,
      access_token: accessToken,
      refreshToken,
      message: "Vous avez réussi à vous connecter avec succès",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
});

//__User Refresh-Token Route
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  // Verify the validity of the refresh token (check if it exists in the database and is not expired)
  if (!isValidRefreshToken(refreshToken)) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
  // If the refresh token is valid, generate a new access token
  const newAccessToken = generateAccessToken(req.user); // Assuming req.user contains user information

  // Serialize user data before sending it in the response (optional)
  const serializedUser = serializeUser(req.user);

  // Return the new access token and serialized user data to the client
  res.json({ accessToken: newAccessToken, user: serializedUser });
});

//__User Forget-password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Generate a reset token and store it in the database with the email and expiration timestamp
  const resetToken = await generateResetToken(email);
  if (resetToken !== "") {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    // Store the reset token in the database
    const resetTokenEntry = new ResetToken({
      email: email,
      token: resetToken,
      expiration: expiration,
    });

    try {
      try {
        await resetTokenEntry.save();
      } catch (error) {
        console.error(error.message);
        // Handle the validation error here
      }
      // Notify the user within the application about the password reset
      notifyUserInApp(email, resetToken);

      return res.json({
        success: true,
        message: "Réinitialisation du mot de passe initiée.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur interne du serveur." });
    }
  } else {
    return res.json({
      success: false,
      message: "Réinitialisation du mot de passe non initiée.",
    });
  }
});

//__User Reset-Token Route
router.post("/reset-password", async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  // Verify that the token is valid and hasn't expired
  if (await isValidResetToken(email, resetToken)) {
    // Update the user's password with the new one
    updatePassword(email, newPassword);
    return res.json({
      success: true,
      message: "Réinitialisation du mot de passe réussie.",
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Jeton de réinitialisation invalide ou expiré.",
    });
  }
});

// Route to update the 'annexe' field / Secured with accessToken
router.put("/update-annexe", validateAccessToken, async (req, res) => {
  try {
    const annexe = req.body.annexe;

    // Check if 'annexe' is not provided or is empty
    if (!annexe) {
      return res.status(400).json({ error: "Annexe field is required" });
    }
    // Check if the user has already updated the 'annexe' field
    const user = await User.findOne({ username: req.user });
    if (user.annexe !== ANNEXE.NONE) {
      return res
        .status(400)
        .json({ error: "Annexe field can only be altered once" });
    }

    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Update the 'annexe' field for the user
    await User.findOneAndUpdate(
      { username: req.user },
      { annexe: req.body.annexe }
    );

    res.status(200).json({ message: "Annexe field updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Add this code at the bottom of your existing routes
// Add this code before the '/api/users' route

//__Route to Get All Users with Role "user"
//__Route to Get All Users with Role "user"
router.post("/users", validateAccessToken, isAdmin, async (req, res) => {
  try {
    const { filterAnnexe } = req.query;

    // Define the filter object based on query parameters
    const filter = {
      role: "user",
    };

    if (filterAnnexe) {
      // Add annexe filtering to the filter object
      filter.annexe = filterAnnexe;
    }

    // Fetch users based on the filter criteria
    const users = await User.find(filter);

    // Define a custom sorting function
    const customSort = (userA, userB) => {
      const annexeA = userA.annexe;
      const annexeB = userB.annexe;

      // Your conditions for sorting
      if ((annexeA >= 1 && annexeA <= 11) || (annexeA >= 11 && annexeA <= 14)) {
        if (
          (annexeB >= 1 && annexeB <= 11) ||
          (annexeB >= 11 && annexeB <= 14)
        ) {
          return annexeA - annexeB;
        } else {
          return -1; // Move userA before userB
        }
      } else if (annexeA > 15 && annexeB > 15) {
        return annexeA - annexeB;
      } else if (annexeA > 15) {
        return -1; // Move userA before userB
      } else {
        return 1; // Move userB before userA
      }
    };

    // Sort the users array using the custom sorting function
    users.sort(customSort);

    // Serialize the user data if needed
    const serializedUsers = users.map((user) => {
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        annexe: user.annexe,
        validated: user.validated,
        nomComplet: user.name + " " + user.lastname,
        // Add other user properties as needed
      };
    });

    // Respond with the sorted list of "user" role users
    return res.status(200).json({
      users: serializedUsers,
      message: "List of users with role 'user' (sorted by annexe)",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
});

// Add this code after the '/api/users' route

//__Route to Verify a User (Set a Field from false to true)
router.put(
  "/verify-user/:userId",
  validateAccessToken,
  isAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      // Find the user by their ID
      const user = await User.findById(userId);

      // Check if the user exists
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", success: false });
      }

      // Set the verification field to true
      user.validated = true;

      // Save the updated user
      await user.save();

      return res.status(200).json({
        message: "User verification updated successfully",
        success: true,
        user: user,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", success: false });
    }
  }
);
// Define the route handler for sending notifications

module.exports = router;
