require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const {
  startNotificationConsumer,
} = require("./consumers/notification.consumer");

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

// Basic health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Notification Service" });
});

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/ticketflow_notifications",
    );
    console.log("Connected to MongoDB");

    // Start RabbitMQ Consumer
    await startNotificationConsumer();

    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Notification Service:", error);
    process.exit(1);
  }
};

startServer();
