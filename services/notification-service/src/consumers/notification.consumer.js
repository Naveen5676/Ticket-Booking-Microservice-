const amqp = require("amqplib");
const Notification = require("../models/notification.model");

const startNotificationConsumer = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost",
    );
    const channel = await connection.createChannel();

    const exchange = "ticketflow";
    const queue = "notification_queue";

    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });

    // Bind to relevant events
    await channel.bindQueue(queue, exchange, "booking.confirmed");
    await channel.bindQueue(queue, exchange, "booking.cancelled");
    await channel.bindQueue(queue, exchange, "payment.failed");

    console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        console.log(`[x] Received ${routingKey}:`, content);

        try {
          let notificationData = {
            userId: content.userId,
            bookingId: content.bookingId,
            createdAt: new Date(),
          };

          if (routingKey === "booking.confirmed") {
            notificationData.type = "BOOKING_CONFIRMED";
            notificationData.title = "Booking Confirmed";
            notificationData.message = `Your booking for event ${content.eventId || content.bookingId} has been confirmed!`;
          } else if (routingKey === "booking.cancelled") {
            notificationData.type = "BOOKING_CANCELLED";
            notificationData.title = "Booking Cancelled";
            notificationData.message = `Your booking ${content.bookingId} has been cancelled.`;
          } else if (routingKey === "payment.failed") {
            notificationData.type = "PAYMENT_FAILED";
            notificationData.title = "Payment Failed";
            notificationData.message = `Payment for your booking ${content.bookingId} failed. Reason: ${content.reason || "Unknown error"}`;
          }

          if (notificationData.type) {
            await Notification.create(notificationData);
            console.log(`[v] Notification stored for user ${content.userId}`);
          }

          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          // Potential nack with requeue: false to avoid loops if schema is broken
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error("Failed to start RabbitMQ consumer:", error);
    // In production, you might want to retry connection
  }
};

module.exports = { startNotificationConsumer };
