const express = require("express");
const axios = require("axios");
const { authMiddleware } = require("../middleware/auth.middleware");

const paymentRouter = express.Router();

const paymentServiceUrl =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3004";

// POST /payments
paymentRouter.post("/payments", authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      `${paymentServiceUrl}/payments`,
      req.body,
      {
        headers: {
          "x-user-id": req.user.userId,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.log("api gateway error", error);
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error in Payment Service" });
  }
});

// GET /payments/:id
paymentRouter.get("/payments/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${paymentServiceUrl}/payments/${req.params.id}`,
      {
        headers: {
          "x-user-id": req.user.userId,
          "x-user-role": req.user.role,
        },
      },
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res
      .status(error?.response?.status || 500)
      .json(error?.response?.data || { message: "Error in Payment Service" });
  }
});

module.exports = paymentRouter;
