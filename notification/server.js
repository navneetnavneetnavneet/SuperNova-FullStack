require("dotenv").config();
const app = require("./src/app");
const { connect } = require("./src/broker/broker");
const listener = require("./src/broker/listener");

const port = process.env.PORT || 3005;

// RabbitMQ connection
connect().then(() => {
  listener();
});

app.listen(port, () => {
  console.log(`Notification service is running on port ${port}`);
});
