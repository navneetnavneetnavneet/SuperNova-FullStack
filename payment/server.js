require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/database/db");
const { connect } = require("./src/broker/broker");

const port = process.env.PORT || 3004;

// database connection
connectDatabase();

// RabbitMQ connection
connect();

app.listen(port, () => {
  console.log(`Payment service is running on port ${port}`);
});
