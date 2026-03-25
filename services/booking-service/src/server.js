require("dotenv").config();
const express = require("express");

const { connectToDatabase } = require("./utils/database");
const { connectRedis } = require("./utils/redis");
const { connectRabbitMQ } = require("./utils/rabbitmq");
const { startPaymentConsumer } = require("./consumers/payment.consumer");
const  {bookingCleanupCron} = require("./cron/booking.cleanup");

const app = express();

const bookingRouter = require("./routes/booking.routes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bookingRouter);

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    // STEP 1: Connect to MongoDB
    await connectToDatabase();

    // STEP 2: Connect to Redis
    await connectRedis();

    //STEP 3: Connect to RabbitMQ
    await connectRabbitMQ();

    //STEP 4: Start Payment Consumer
    await startPaymentConsumer();

    //STEP 5: CRON job for cleanup
    bookingCleanupCron();

    // STEP 6: Start the server
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
