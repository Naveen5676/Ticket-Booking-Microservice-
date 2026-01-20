/**
 * Mock Payment Gateway
 * Simulates payment processing
 * 70% success rate for testing
 */

const mockPaymentGateway = (amount, paymentMethod) => {
  // 70% success rate
  const isSuccess = Math.random() > 0.3;

  if (isSuccess) {
    const paymentId = `pay_${Date.now()}`;
    const transactionId = `txn_${Date.now() + 100}`;

    console.log(`✅ Payment successful: ${paymentId}`);

    return {
      success: true,
      paymentId,
      transactionId,
      amount,
      status: "success",
      message: "Payment processed successfully",
    };
  } else {
    const reasons = [
      "Insufficient funds",
      "Card declined",
      "Payment timeout",
      "Invalid card details",
    ];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    console.log(`❌ Payment failed: ${reason}`);

    return {
      success: false,
      paymentId: null,
      transactionId: null,
      amount,
      status: "failed",
      reason,
      message: "Payment failed",
    };
  }
};

module.exports = {
  mockPaymentGateway,
};
