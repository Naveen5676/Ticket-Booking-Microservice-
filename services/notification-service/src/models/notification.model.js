const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // String to match existing users if needed, or ObjectId
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["BOOKING_CONFIRMED", "BOOKING_CANCELLED", "PAYMENT_FAILED"],
      required: true,
    },
    title: String,
    message: String,
    bookingId: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
