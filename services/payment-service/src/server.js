require("dotenv").config();

const express = require("express");

const paymentRouter = require("./routes/payment.routes");

const { connectToDatabase } = require("./utils/database");
const { connectRabbitMQ } = require("./utils/rabbitmq");

const PORT = process.env.PORT || 3004;

const app = express();

app.use(express.json());

app.use(paymentRouter);

const startServer = async () => {
  try {
    await connectToDatabase();

    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
