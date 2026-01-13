require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const { connectToDatabase } = require("./utils/database");

const app = express();

const PORT = process.env.PORT || 3001;

//Express router imports
const userRouter = require("./routes/user.routes");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` User Service Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("User service Failed start", err);
    process.exit(1);
  });
