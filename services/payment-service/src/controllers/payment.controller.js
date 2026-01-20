require("dotenv").config();

const { mockPaymentGateway } = require("../utils/mockPaymentGateway");
const { createPaymentSchema } = require("../validator/payment.validator");
const { publishEvent } = require("../utils/rabbitmq");
const Payment = require("../models/payment.model");

const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;

const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Transaction id is required",
      });
    }

    const payment = await Payment.findOne({ transactionId: id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment found",
      data: payment,
    });
  } catch (error) {
    console.error("Get payment error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const processPayment = async (req, res) => {
  try {
    // Step 1: Validate request
    const { error } = createPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { bookingId, paymentMethod } = req.body;
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID missing",
      });
    }
    // Step 2: Get booking details from Booking Service
    let booking;
    try {
      const bookingResponse = await axios.get(
        `${bookingServiceUrl}/bookings/${bookingId}`,
      );
      booking = bookingResponse.data.data;
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    // Step 3: Check if booking is in pending state
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment. Booking status is ${booking.status}`,
      });
    }
    // Step 4: Check if booking has expired
    if (booking.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Booking has expired. Please create a new booking.",
      });
    }
    // Step 5: Generate unique paymentId
    const paymentId = `pay_${Date.now()}`;
    // Step 6: Create payment record with status "processing"
    const payment = await Payment.create({
      bookingId,
      userId,
      amount: booking.totalAmount,
      status: "processing",
      paymentMethod,
      paymentId,
    });
    // Step 7: Return immediate response to user
    res.status(202).json({
      success: true,
      message: "Payment is being processed",
      data: {
        paymentId: payment.paymentId,
        bookingId: payment.bookingId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
    // Step 8: Process payment asynchronously (don't await in response)
    processPaymentAsync(payment, booking);
  } catch (error) {
    console.error("Process payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Async payment processing
 * Runs in background after response is sent
 */
const processPaymentAsync = async (payment, booking) => {
  try {
    // Call mock payment gateway
    const paymentResult = await mockPaymentGateway(
      payment.amount,
      payment.paymentMethod,
    );
    // Update payment record
    payment.status = paymentResult.status;
    payment.transactionId = paymentResult.transactionId;
    payment.completedAt = Date.now();

    if (!paymentResult.success) {
      payment.failureReason = paymentResult.reason;
    }

    await payment.save();
    // Publish event to RabbitMQ
    if (paymentResult.success) {
      await publishEvent("payment_events", "payment.success", {
        bookingId: booking._id || booking.bookingId,
        paymentId: paymentResult.paymentId,
        transactionId: paymentResult.transactionId,
        amount: payment.amount,
        userId: payment.userId,
      });
    } else {
      await publishEvent("payment_events", "payment.failed", {
        bookingId: booking._id || booking.bookingId,
        reason: paymentResult.reason,
        userId: payment.userId,
      });
    }
  } catch (error) {
    console.error("Async payment processing error:", error);

    // Update payment to failed
    payment.status = "failed";
    payment.failureReason = "Internal processing error";
    payment.completedAt = Date.now();
    await payment.save();

    // Publish failure event
    await publishEvent("payment_events", "payment.failed", {
      bookingId: booking._id || booking.bookingId,
      reason: "Internal processing error",
      userId: payment.userId,
    });
  }
};

module.exports = {
  getPayment,
  processPayment,
};
