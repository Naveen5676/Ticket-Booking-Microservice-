const authMiddleware = require("../middleware/auth.middleware");
const express = require("express");
const axios = require("axios");

const bookingRouter = express.Router();

const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;

bookingRouter.post("/bookings", authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      `${bookingServiceUrl}/bookings`,
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
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error in Booking Service" });
  }
});

bookingRouter.get("/bookings", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${bookingServiceUrl}/bookings`, {
      headers: {
        "x-user-id": req.user._id,
        "x-user-role": req.user.role,
      },
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error in Booking Service" });
  }
});

bookingRouter.get("/bookings/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${bookingServiceUrl}/bookings/${req.params.id}`,
      {
        headers: {
          "x-user-id": req.user._id,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error in Booking Service" });
  }
});

bookingRouter.delete("/bookings/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.delete(
      `${bookingServiceUrl}/bookings/${req.params.id}`,
      {
        headers: {
          "x-user-id": req.user._id,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error in Booking Service" });
  }
});

bookingRouter.patch("/bookings/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.patch(
      `${bookingServiceUrl}/bookings/${req.params.id}`,
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
    console.error("error", error);
    return res.status(error?.response?.status || 500).json(
      error?.response?.data?.message || {
        message: "Error in Booking Service",
      },
    );
  }
});

module.exports = bookingRouter;
