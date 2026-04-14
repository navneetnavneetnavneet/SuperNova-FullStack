const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

module.exports.initSocketIoServer = (httpServer) => {
  const io = new Server(httpServer, {});

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;

    const { token } = cookies ? cookie.parse(cookies) : {};

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.token = token;
      next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    console.log(socket.user);
    console.log(socket.token);

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};
