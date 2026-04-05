const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database Connection Established");
  } catch (error) {
    console.log("Database Connection Failed : ", error);
  }
};

module.exports = connectDatabase;
