const express = require("express");

const eventRouter = express.Router();

const {
  createEvent,
  getEvents,
  patchEvent,
  getParticularEvent,
  deleteEvent,
  getEventSeats,
  patchSeatStatus,
} = require("../controllers/event.controllers");

eventRouter.post("/events", createEvent);
eventRouter.get("/events", getEvents);
eventRouter.get("/events/:id", getParticularEvent);
eventRouter.patch("/events/:id", patchEvent);
eventRouter.delete("/events/:id", deleteEvent);
eventRouter.get("/events/:id/seats", getEventSeats);

// internally used by the booking service
eventRouter.patch("/events/:id/seats", patchSeatStatus);

module.exports = eventRouter;
