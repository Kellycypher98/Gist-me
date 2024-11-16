import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import authRoutes from "./server/routes/auth.js";
import roomRoutes from "./server/routes/chatRoutes.js";
import userRoutes from "./server/routes/users.js";
import socketInit from "./server/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketInit(server);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'https://gist-me-rose.vercel.app',
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

app.get("/", (req, res) => {
  res.send("Gist.me Backend is running");
});

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Important: Listen on process.env.PORT for Elastic Beanstalk
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});