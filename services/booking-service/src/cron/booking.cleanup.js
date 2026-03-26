const cron = require("node-cron");
const Booking = require("../models/booking.model");
const { redisClient } = require("../utils/redis");
const axios = require("axios");
const { publishEvent } = require("../utils/rabbitmq");

const eventServiceUrl = process.env.EVENT_SERVICE_URL;

const bookingCleanupCron = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("🧹 Running pending bookings cleanup cron job...");

    try {
      const pendingBookings = await Booking.find({ status: "pending" });

      for (let booking of pendingBookings) {
        let isExpired = false;

        // Check Redis for seat locks
        for (let seatNumber of booking.seats) {
          const lockKey = `seat:lock:${booking.eventId}:${seatNumber}`;
          const isLocked = await redisClient.get(lockKey);

          // If lock is not in redis, the ttl has expired
          if (!isLocked) {
            isExpired = true;
            break;
          }
        }

        // Also check hard expiration time
        if (booking.expiresAt < Date.now()) {
          isExpired = true;
        }

        if (isExpired) {
          console.log(`⚠️ Booking ${booking._id} expired. Starting cleanup...`);

          // 1. Mark the booking as "expired"
          booking.status = "expired";
          await booking.save();

          // 2. Release the seats back to "available" in Event Service
          for (const seatNumber of booking.seats) {
            try {
              await axios.patch(
                `${eventServiceUrl}/events/${booking.eventId}/seats`,
                {
                  eventId: booking.eventId,
                  seatNumber,
                  status: "available", // freeing up the seat
                  userId: booking.userId,
                },
              );
              console.log(`🔓 Seat ${seatNumber} released successfully`);

              // Also ensure redis lock is deleted (it should be, but just in case)
              await redisClient.del(
                `seat:lock:${booking.eventId}:${seatNumber}`,
              );
            } catch (error) {
              console.error(
                `❌ Error releasing seat ${seatNumber}:`,
                error.message,
              );
            }
          }

          // 3. Publish booking.cancelled event so Notification Service knows
          publishEvent("booking_events", "booking.cancelled", {
            bookingId: booking._id,
            userId: booking.userId,
            reason: "Reservation expired",
          });

          console.log(`✅ Cleanup finished for booking ${booking._id}`);
        }
      }
    } catch (error) {
      console.error("❌ Cleanup cron error:", error);
    }
  });
};

module.exports = { bookingCleanupCron };
