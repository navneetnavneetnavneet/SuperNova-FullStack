require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/database/db");
const { connect } = require("./src/broker/broker");
const listener = require("./src/broker/listener");

const port = process.env.PORT || 3006;

// database connection
connectDatabase();

// RabbitMQ connection
connect().then(() => {
  listener();
});

app.listen(port, () => {
  console.log(`Seller service is running on port ${port}`);
});
