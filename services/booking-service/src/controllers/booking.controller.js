require("dotenv").config();

const axios = require("axios");

const {
  createBookingSchema,
  validatePatchBookingSchema,
} = require("../validator/booking.validator");

const { redisClient } = require("../utils/redis");

const Booking = require("../models/booking.model");

const eventServiceUrl = process.env.EVENT_SERVICE_URL;

const createBooking = async (req, res) => {
  try {
    // 1 validate the joi schema
    const { error } = createBookingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const loggedInUser = req.headers["x-user-id"];

    const { eventId, seats } = req.body;

    // 2 check if event exists
    const eventDetails = await axios.get(
      `${eventServiceUrl}/events/${eventId}`,
    );

    if (eventDetails?.data?.success === false) {
      return res.status(404).json({ message: eventDetails?.data?.message });
    }

    // 3 check if seats are available
    const allSeats = eventDetails?.data?.data?.seats || [];
    const requestedSeatsInfo = allSeats.filter((seat) =>
      seats.includes(seat.seatNumber),
    );

    const unavailableSeats = requestedSeatsInfo.filter(
      (seat) => seat.status !== "available",
    );

    if (unavailableSeats.length > 0) {
      const message = `seat ${unavailableSeats.map((seat) => seat.seatNumber).join(", ")} are not available`;
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    // 4 check redix locks: is seat already locked by another process?
    for (const seatNumber of seats) {
      const lockKey = `seat:lock:${eventId}:${seatNumber}`;
      const isLocked = await redisClient.get(lockKey);
      if (isLocked) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} is temporarily held by another user. Try again in 10 minutes.`,
        });
      }
    }

    // 5 if seat is not locked then lock it in Event Service
    // We do this one by one. If one fails, we should ideally rollback.
    // TODO : need ot update the event service to allow teh seatnumber as an array
    const lockedInEventService = [];
    try {
      for (const seatNumber of seats) {
        await axios.patch(`${eventServiceUrl}/events/${eventId}/seats`, {
          eventId,
          seatNumber,
          status: "locked",
          userId: loggedInUser,
        });
        lockedInEventService.push(seatNumber);
      }
    } catch (lockError) {
      // Rollback: Revert status to available for the seats we just locked
      for (const seatNumber of lockedInEventService) {
        await axios
          .patch(`${eventServiceUrl}/events/${eventId}/seats`, {
            eventId,
            seatNumber,
            status: "available",
            userId: loggedInUser,
          })
          .catch((e) => console.error("Rollback failed for", seatNumber));
      }
      return res.status(500).json({
        success: false,
        message: "Error locking seats. Please try again.",
      });
    }

    // 6 set redis ttl for 10 min
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    for (const seatNumber of seats) {
      const lockKey = `seat:lock:${eventId}:${seatNumber}`;
      // Set Redis lock with numeric TTL (600 seconds = 10 mins)
      await redisClient.setEx(
        lockKey,
        600,
        JSON.stringify({
          userId: loggedInUser,
          status: "locked",
          expiresAt,
        }),
      );
    }

    // 7 in mongo db set the booking status to pending along with event id and seats
    const totalAmount =
      seats.length * (eventDetails?.data?.data?.pricePerSeat || 0);

    const booking = await Booking.create({
      eventId,
      userId: loggedInUser,
      seats,
      totalAmount,
      status: "pending",
      expiresAt,
    });

    // 8 publish to rabbmit mq todo for the payment service
    // TODO: Publish to RabbitMQ so Payment Service knows a booking is waiting
    // publishToQueue("booking.created", { bookingId: booking._id, totalAmount });

    // 9 return booking details
    return res.status(201).json({
      success: true,
      message:
        "Booking initiated successfully. Please complete payment within 10 minutes.",
      data: {
        bookingId: booking._id,
        eventId,
        seats,
        totalAmount,
        expiresAt,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const allowedStatus = ["pending", "confirmed", "cancelled", "expired"];

    const { status = "", page = 1, limit = 10 } = req.query;

    let query = {};

    let LowercaseStatus = status?.trim()?.toLowerCase();

    if (status && allowedStatus.includes(LowercaseStatus)) {
      query.status = LowercaseStatus;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query).skip(skip).limit(limit);

    const totalBookingCount = await Booking.countDocuments(query);

    if (bookings) {
      return res.status(200).json({
        success: true,
        message: "Booking fetched successfuly",
        data: {
          page: page,
          limit: limit,
          total: totalBookingCount,
          bookings: bookings,
        },
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Booking id is required",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfuly",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Booking id is required",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking?.status = "cancelled";
    await booking.save();

    // TODO: publish to rabbitmq to release the lock and update
    // the event service to update its seats to available

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfuly",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const patchBooking = async (req, res) => {
  try {
    const allowedStatus = ["pending", "confirmed", "cancelled", "expired"];

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Booking id is required",
      });
    }

    const { error } = validatePatchBookingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { paymentId, status, transactionId } = req.body;

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const bookingDetail = await Booking.findById(id);

    if (!bookingDetail) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (bookingDetail.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking is not in pending state",
      });
    }

    bookingDetail.paymentId = paymentId;
    bookingDetail.status = status;
    bookingDetail.transactionId = transactionId;
    await bookingDetail.save();

    return res.status(200).json({
      success: true,
      message:
        "Booking created successfully. Please complete payment within 10 minutes.",
      data: bookingDetail,
    });

    //TODO: publish to rabbitmq to release the lock and update
    // the event service to update its seats to booked
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  deleteBooking,
  patchBooking,
};
