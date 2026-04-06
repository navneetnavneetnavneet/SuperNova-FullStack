require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/database/db");

const port = process.env.PORT || 3003;

// database connection
connectDatabase();

app.listen(port, () => {
  console.log(`Order service is running on port ${port}`);
});
