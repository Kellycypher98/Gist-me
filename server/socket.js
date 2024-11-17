import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Room from "./models/Rooms.js";
import User from "./models/User.js";
import Message from "./models/Messages.js";

export default function (server) {
  const NODE_ENV = process.env.NODE_ENV || "development";
  const FRONTEND_URL =
    process.env.FRONTEND_URL || "https://gist-me-rose.vercel.app";

  const io = new Server(server, {
    cors: {
      origin:
        NODE_ENV === "production"
          ? [FRONTEND_URL, /\.elasticbeanstalk\.com$/, /\.amazonaws\.com$/]
          : "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      // Enables client recovery of missed messages
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    },
    // Add rate limiting for socket connections
    allowRequest: (req, callback) => {
      // Implement your socket connection rate limiting here
      callback(null, true);
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("No token provided");
      return next(new Error("Authentication required"));
    }

    try {
      // Make sure to use the correct property from decoded token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Log the decoded token for debugging
      console.log("Decoded token:", decoded);

      // Make sure you're using the correct property (id or _id)
      const userId = decoded.id || decoded._id;

      if (!userId) {
        console.log("No user ID in token:", decoded);
        return next(new Error("Invalid token structure"));
      }

      const user = await User.findById(userId).select("-password");

      // Log the user lookup attempt
      console.log("Looking up user:", userId);
      console.log("Found user:", user);

      if (!user) {
        console.log(`User not found for ID: ${userId}`);
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.log("Authentication failed", err);
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });
  // Connection and events
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join room
    socket.on("joinRoom", async (roomId) => {
      const room = await Room.findById(roomId);
      if (room) {
        socket.join(roomId);
        console.log(`${socket.user.username} joined room ${roomId}`);
      }
    });

    // Leave room
    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.user.username} left room ${roomId}`);
    });

    // Send message
    socket.on("sendMessage", async ({ roomId, text }) => {
      const message = new Message({
        roomId,
        text,
        sender: socket.user._id,
      });
      await message.save();
      io.to(roomId).emit("newMessage", {
        ...message.toObject(),
        sender: socket.user, // Send back message with user info
      });
    });

    socket.on("typing", ({ roomId, userId, username }) => {
      socket.to(roomId).emit("userTyping", { userId, username, roomId });
    });

    socket.on("stopTyping", ({ roomId, userId }) => {
      socket.to(roomId).emit("userStoppedTyping", { userId, roomId });
    });

    // When user disconnects, clear their typing status
    socket.on("disconnect", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          // Skip the default room
          socket.to(roomId).emit("userStoppedTyping", {
            userId: socket.user._id,
            username: socket.user.username,
          });
        }
      });
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
}
