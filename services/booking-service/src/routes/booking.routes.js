const express = require("express");
const {
  createBooking,
  getBookings,
  getBooking,
  deleteBooking,
  patchBooking
} = require("../controllers/booking.controller");

const bookingRouter = express.Router();

bookingRouter.post("/bookings", createBooking);
bookingRouter.get("/bookings", getBookings);
bookingRouter.get("/bookings/:id", getBooking);
bookingRouter.delete("/bookings/:id", deleteBooking);
bookingRouter.patch("/bookings/:id", patchBooking);

module.exports = bookingRouter;     
