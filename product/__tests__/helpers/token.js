const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

exports.generateToken = (role = "seller") => {
  return jwt.sign(
    {
      _id: new mongoose.Types.ObjectId(),
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};