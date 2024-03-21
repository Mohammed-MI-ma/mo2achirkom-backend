//__DEPENDENCIES
const jwt = require("jsonwebtoken");

//__MODELS
const User = require("../models/User");

//___SECRECT_KEY
const { SECRET } = require("../config");

const validateAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.header("x-auth-token");
    if (!accessToken) {
      return res.status(401).json({ error: "Le jeton d'accès est manquant." });
    }
    const decoded = jwt.verify(accessToken, SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({
        error:
          "Token d'accès invalide, veuillez vous reconnecter une fois de plus.",
      });
    }
    const user = await User.findOne({ username: decoded.username });
    if (Object.keys(user).length === 0) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }
    req.user = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({
      error:
        "Token d'accès invalide, veuillez vous reconnecter une fois de plus.",
    });
  }
};
module.exports = validateAccessToken;
