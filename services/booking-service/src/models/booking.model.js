const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Event",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    seats: [
      {
        type: String,
        required: true,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "expired"],
      default: "pending",
    },
    paymentId: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Number, // Epoch timestamp
      required: true,
    },
    confirmedAt: {
      type: Number,
      default: null,
    },
    cancelledAt: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
