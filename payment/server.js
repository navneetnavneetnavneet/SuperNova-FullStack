require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/database/db");

const port = process.env.PORT || 3004;

// database connection
connectDatabase();

app.listen(port, () => {
  console.log(`Payment service is running on port ${port}`);
});
