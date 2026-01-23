require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const userRoutes = require("./routes/user.routes");
const eventRoutes = require("./routes/event.routes");
const bookingRouter = require("./routes/booking.routes");
const paymentRouter = require("./routes/payment.routes");

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRoutes);
app.use("/events", eventRoutes);
app.use("/bookings", bookingRouter);
app.use("/payment", paymentRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
