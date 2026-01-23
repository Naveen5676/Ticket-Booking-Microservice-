const express = require("express");
const axios = require("axios");
const { authMiddleware } = require("../middleware/auth.middleware");

const eventRouter = express.Router();

const eventServiceUrl =
  process.env.EVENT_SERVICE_URL || "http://localhost:3002";

eventRouter.post("/events", authMiddleware, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const response = await axios.post(`${eventServiceUrl}/events`, req.body, {
      headers: {
        "x-user-id": loggedInUser._id,
        "x-user-role": loggedInUser.role,
      },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

eventRouter.get("/events", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${eventServiceUrl}/events`, {
      params: req.query,
      headers: {
        "x-user-id": req.user._id,
        "x-user-role": req.user.role,
      },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

eventRouter.get("/events/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${eventServiceUrl}/events/${req.params.id}`,
      {
        headers: {
          "x-user-id": req.user._id,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

eventRouter.patch("/events/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.patch(
      `${eventServiceUrl}/events/${req.params.id}`,
      req.body,
      {
        headers: {
          "x-user-id": req.user._id,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

eventRouter.delete("/events/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.delete(
      `${eventServiceUrl}/events/${req.params.id}`,
      {
        headers: {
          "x-user-id": req.user._id,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

eventRouter.get("/events/:id/seats", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${eventServiceUrl}/events/${req.params.id}/seats`,
      {
        headers: {
          "x-user-id": req.user._id,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error" });
  }
});

module.exports = eventRouter;
