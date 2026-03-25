const Events = require("../models/event.schema");

const {
  createEventSchema,
  getEventsSchema,
  patchSeatStatusSchema,
} = require("../validator/event.validator");

const { generateSeats } = require("../helper/event.helper");

const mongoose = require("mongoose");

const createEvent = async (req, res) => {
  try {
    console.log("headres", req.headers);
    const loggedInUserId = req.headers["x-user-id"];
    const loggedInUserRole = req.headers["x-user-role"];

    if (loggedInUserRole.toLowerCase() !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { error } = createEventSchema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const {
      name,
      description,
      venue,
      date,
      totalSeats,
      pricePerSeat,
      category,
    } = req.body;

    const seats = generateSeats(totalSeats);

    console.log("loggedInUserId", loggedInUserId);

    const event = await Events.create({
      eventName: name,
      description,
      venue,
      date,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      category,
      seats,
      createdBy: loggedInUserId,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getEvents = async (req, res) => {
  try {
    const { error } = getEventsSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { page, limit, category, search, upcoming } = req.query;

    //skipping upcomming for now will implement it later

    const skip = (page - 1) * limit;

    const query = {};

    if (category && category.trim()?.length > 0) {
      query.category = category;
    }

    if (search && search.trim()?.length > 0) {
      query.name = { $regex: search, $options: "i" };
    }

    const data = await Events.find(query).skip(skip).limit(limit);

    const totalEvents = await Events.countDocuments();

    return res.status(200).json({
      status: "success",
      message: "Events fetched successfully",
      data: {
        page: page + 1,
        limit,
        totlaEvents: totalEvents,
        data: data,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getParticularEvent = async (req, res) => {
  try {
    console.log("called inside getparticular events");
    // const loggedInUserRole = req.headers["x-user-role"];

    // if (loggedInUserRole.toLowerCase() !== "admin") {
    //   return res.status(401).json({ success: false, message: "Unauthorized" });
    // }

    console.log("req.params", req.params);
    const eventId = req.params.id;

    if (!eventId) {
      return res
        .status(400)
        .json({ success: false, message: "Event id is required" });
    }


    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Event ID format",
      });
    }

    const event = await Events.findById(eventId);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      data: event,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error });
  }
};

const patchEvent = async (req, res) => {
  try {
    const loggedInUserRole = req.headers["x-user-role"];

    if (loggedInUserRole.toLowerCase() !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventId = req.params.id;

    if (!eventId) {
      return res.status(400).json({ message: "Event id is required" });
    }

    const { error } = patchEventSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const event = await Events.findByIdAndUpdate(eventId, req.body, {
      new: true,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res
        .status(402)
        .json({ success: false, message: "Event id is required" });
    }

    const event = await Events.findById(eventId);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    //check if bokking exists then mark it as cancelled instead of deleting the event

    const bookedSeatCount = event.seats.filter(
      (seat) => seat.status === "booked",
    )?.length;

    if (bookedSeatCount > 0) {
      event.status = "cancelled";
      await event.save();

      // TODO: Publish event to RabbitMQ for Booking Service to handle refunds
      // publishToQueue('event.cancelled', { eventId, bookedSeats: bookedSeatsCount });

      return res.status(200).json({
        success: true,
        message: "Event cancelled successfully , Refund will be processed",
        data: {
          eventId,
          status: "cancelled",
          affectedBooking: bookedSeatCount,
        },
      });
    } else {
      //no booking exists so delete the event
      await Events.findByIdAndDelete(eventId);
      return res.status(200).json({
        success: true,
        message: "Event deleted successfully",
        data: {
          eventId,
          status: "deleted",
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getEventSeats = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res.status(400).json({ message: "Event id is required" });
    }

    const event = await Events.findById(eventId).select(
      "eventName totalSeats seats availableSeats",
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const availableSeats = event.seats.filter(
      (seat) => seat.status === "available",
    )?.length;

    const bookedSeats = event.seats.filter(
      (seat) => seat.status === "booked",
    )?.length;

    const lockedSeats = event.seats.filter(
      (seat) => seat.status === "locked",
    )?.length;

    return res.status(200).json({
      success: true,
      message: "Event seats fetched successfully",
      data: {
        eventId: event._id,
        eventName: event.eventName,
        totalSeats: event.totalSeats,
        availableSeats: availableSeats,
        lockedSeats: lockedSeats,
        bookedSeats: bookedSeats,
        seats: event.seats.map((seat) => ({
          seatNumber: seat.seatNumber,
          status: seat.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const patchSeatStatus = async (req, res) => {
  try {
    const { error } = patchSeatStatusSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { eventId, seatNumber, status, userId } = req.body;

    const event = await Events.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const seat = event.seats.find((seat) => seat.seatNumber === seatNumber);

    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    const currentSeatStatus = seat.status;

    // available → locked (OK)
    // locked → booked (OK)
    // locked → available (OK - timeout/cancel)
    // booked → available (OK - refund)
    // available → booked (NOT OK - must lock first)

    if (currentSeatStatus === "available" && status === "booked") {
      return res
        .status(400)
        .json({ message: "Cannot book without locking first" });
    }
    if (currentSeatStatus === "booked" && status === "locked") {
      return res
        .status(400)
        .json({ message: "Cannot lock already booked seat" });
    }

    //update seat status
    const oldStatus = seat.status;
    seat.status = status;

    // Update availableSeats count
    if (oldStatus === "available" && status !== "available") {
      event.availableSeats -= 1;
    } else if (oldStatus !== "available" && status === "available") {
      event.availableSeats += 1;
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: "Seat status updated",
      data: {
        eventId,
        seatNumber,
        oldStatus,
        newStatus: status,
        availableSeats: event.availableSeats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getParticularEvent,
  patchEvent,
  deleteEvent,
  getEventSeats,
  patchSeatStatus,
};
