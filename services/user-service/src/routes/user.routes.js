const express = require("express");

const userRouter = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUser,
  getUserById,
  verifyToken,
} = require("../controllers/user.controller");

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/verify-token", verifyToken);
userRouter.get("/profile", getUserProfile);
userRouter.patch("/update", updateUser);
userRouter.get("/:id", getUserById);

module.exports = userRouter;
