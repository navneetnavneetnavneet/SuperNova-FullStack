const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const redis = require("../database/redis");

module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized : No token provided",
    });
  }

  try {
    const isBlacklistedToken = await redis.get(`blacklist:${token}`);

    if (isBlacklistedToken) {
      return res.status(401).json({
        message: "Unauthorized : Token is blacklisted",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized : Invalid credentials",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
