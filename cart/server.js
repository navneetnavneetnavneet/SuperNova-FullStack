require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/database/db");

const port = process.env.PORT || 8002;

// database connection
connectDatabase();

app.listen(port, () => {
  console.log(`Cart service is running on port ${port}`);
});
