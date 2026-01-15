const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: Number,
      required: true,
    },
    pricePerSeat: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    seats: {
      type: Array,
      required: true,
    },
    createdBy: {
      type: mongoose.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ eventName: 1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
