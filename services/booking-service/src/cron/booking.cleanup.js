const cron = require("node-cron");

const booking = require("../models/booking.model");

const redisClient = require("../utils/redis");

const eventServiceUrl = process.env.EVENT_SERVICE_URL;

const bookingCleanupCron = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("🧹 Running pending bookings cleanup cron job...");

    const pendingBooking = booking.find({ status: "pending" });

    for (let booking of pendingBooking) {
      let isLockMissing = false;

      //Check for redis for seat locks
      for (let seatNumber of booking.seats) {
        const lockKey = `seat:lock:${booking.eventId}:${seatNumber}`;

        const isLocked = await redisClient.get(lockKey);

        // If lock is not in redis , the ttl has expired
        if (!isLocked) {
          isLockMissing = true;
          break;
        }

        // If Redis lock is gone OR the hard expiresAt timestamp has passed
        if (isLockMissing || booking.expiresAt < new Date.now()) {
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
            } catch (error) {
              console.error(
                `❌ Error releasing seat ${seatNumber}:`,
                error.message,
              );
            }
          }
          console.log(`✅ Cleanup finished for booking ${booking._id}`);
        }
      }
    }
  });
};

module.exports = { bookingCleanupCron };
