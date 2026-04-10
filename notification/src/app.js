const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// cookie-parser
app.use(cookieParser());

// body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// morgan
app.use(morgan("dev"));

// routes
app.get("/", (req, res) => {
  res.json({ message: "Notification service is runninig and up" });
});

module.exports = app;
