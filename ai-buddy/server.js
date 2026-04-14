require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { initSocketIoServer } = require("./src/sockets/socket.server");

const port = process.env.PORT || 3007;

// socket.io server setup
const httpServer = http.createServer(app);
initSocketIoServer(httpServer);

httpServer.listen(port, () => {
  console.log(`AI Buddy service is running on port ${port}`);
});
