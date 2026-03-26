require("dotenv").config();

const { consumeEvent, publishEvent } = require("../utils/rabbitmq");
const Booking = require("../models/booking.model");
const { redisClient } = require("../utils/redis");
const axios = require("axios");

const eventServiceUrl = process.env.EVENT_SERVICE_URL;

const startPaymentConsumer = async () => {
  //consume 1 : handle payment success
  await consumeEvent(
    "payment_events",
    "payment.success",
    "booking_service_payment_success_queue",
    async (data) => {
      try {
        const { bookingId, paymentId, transactionId } = data;

        console.log("payment successful for booking ", bookingId);

        //find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          console.error(`Booking not found: ${bookingId}`);
          return;
        }

        if (booking.status !== "pending") {
          console.log(`Booking already processed: ${booking.status}`);
          return;
        }

        // Update booking to confirmed
        booking.status = "confirmed";
        booking.paymentId = paymentId;
        booking.transactionId = transactionId;
        booking.confirmedAt = Date.now();
        await booking.save();

        // Update Event Service seats to "booked"
        for (const seat of booking.seats) {
          try {
            await axios.patch(
              `${eventServiceUrl}/events/${booking.eventId}/seats`,
              {
                eventId: booking.eventId,
                seatNumber: seat,
                status: "booked",
                userId: booking.userId,
              },
            );

            // Delete Redis lock
            await redisClient.del(`seat:lock:${booking.eventId}:${seat}`);

            console.log(`🔓 Seat ${seat} confirmed and unlocked`);
          } catch (error) {
            console.error(`Error updating seat ${seat}:`, error.message);
          }
        }

        console.log(`✅ Booking ${bookingId} confirmed successfully`);

        // Publish booking.confirmed event for Notification Service
        publishEvent("booking_events", "booking.confirmed", {
          bookingId: booking._id,
          userId: booking.userId,
          eventId: booking.eventId,
        });
      } catch (error) {
        console.error("Error in success payment event ", error);
        throw error;
      }
    },
  );

  // Consumer 2: Handle payment failure
  await consumeEvent(
    "payment_events",
    "payment.failed",
    "booking_service_payment_failed_queue",
    async (data) => {
      try {
        const { bookingId, reason } = data;

        console.log(`❌ Payment failed for booking: ${bookingId} - ${reason}`);

        // Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          console.error(`Booking not found: ${bookingId}`);
          return;
        }

        // Update booking to failed
        booking.status = "failed";
        await booking.save();

        // Release seats in Event Service
        for (const seat of booking.seats) {
          try {
            await axios.patch(
              `${eventServiceUrl}/events/${booking.eventId}/seats`,
              {
                eventId: booking.eventId,
                seatNumber: seat,
                status: "available",
                userId: booking.userId,
              },
            );

            // Delete Redis lock
            await redisClient.del(`seat:lock:${booking.eventId}:${seat}`);

            console.log(`🔓 Seat ${seat} released`);
          } catch (error) {
            console.error(`Error releasing seat ${seat}:`, error.message);
          }
        }

        console.log(`❌ Booking ${bookingId} marked as failed, seats released`);

        // Publish booking.failed event (aliased to cancelled for notification logic)
        publishEvent("booking_events", "booking.cancelled", {
          bookingId: booking._id,
          userId: booking.userId,
          reason: reason,
        });
      } catch (error) {
        console.error("Error in failed payment event ", error);
        throw error;
      }
    },
  );
};

module.exports = {
  startPaymentConsumer,
};
