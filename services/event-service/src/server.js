require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./utils/database");

const eventRouter = require("./routes/event.routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(eventRouter);

const PORT = process.env.PORT || 3002;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Event Service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
