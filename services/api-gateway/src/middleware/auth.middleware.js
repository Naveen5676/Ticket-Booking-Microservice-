const axios = require("axios");

const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3001";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Token required" });
    }

    const response = await axios.get(`${userServiceUrl}/users/verify-token`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!response?.data?.success) {
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("user in authmiddleware", response?.data?.user);

    //add  user info to the header
    // req.headers["x-user-id"] = response?.data?.userId;
    // req.headers["x-user-role"] = response?.data?.role;

    req.user = response?.data?.user;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { authMiddleware };
