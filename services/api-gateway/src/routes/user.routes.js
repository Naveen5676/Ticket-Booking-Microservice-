const express = require("express");
const axios = require("axios");
const { authMiddleware } = require("../middleware/auth.middleware");

const userRouter = express.Router();

const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3001";

userRouter.post("/register", async (req, res) => {
  try {
    const response = await axios.post(
      `${userServiceUrl}/users/register`,
      req.body,
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Error" });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const response = await axios.post(
      `${userServiceUrl}/users/login`,
      req.body,
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

userRouter.post("/logout", async (req, res) => {
  try {
    const response = await axios.post(
      `${userServiceUrl}/users/logout`,
      req.body,
    );
    res.clearCookie("token");
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

userRouter.get("/profile", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${userServiceUrl}/users/profile`, {
      headers: {
        "x-user-id": req.headers["x-user-id"],
        "x-user-role": req.headers["x-user-role"],
      },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

userRouter.patch("/update", authMiddleware, async (req, res) => {
  try {
    const response = await axios.patch(
      `${userServiceUrl}/users/update`,
      req.body,
      {
        headers: {
          "x-user-id": req.headers["x-user-id"],
          "x-user-role": req.headers["x-user-role"],
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

userRouter.get("/profile/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${userServiceUrl}/users/${req.params.id}`,
      {
        headers: {
          "x-user-id": req.headers["x-user-id"],
          "x-user-role": req.headers["x-user-role"],
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

module.exports = userRouter;
