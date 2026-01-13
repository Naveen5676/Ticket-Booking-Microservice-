require("dotenv").config();

const User = require("../models/user.schema");
const { verifyToken } = require("../services/auth.service");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    const decodeToken = await verifyToken(token);

    if (!decodeToken) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decodeToken.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { authMiddleware };
