import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/users.js";
import socketInit from "./socket.js";

dotenv.config();

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://gist-me-rose.vercel.app";

// Validate critical environment variables
const requiredEnvVars = ["MONGO_URI", "FRONTEND_URL"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
});

// CORS configuration based on environment
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? [FRONTEND_URL, /\.elasticbeanstalk\.com$/] // Allow both Vercel and EB domains
      : "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

const app = express();
const server = http.createServer(app);
const io = socketInit(server);
app.set("trust proxy", true);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet()); // Add security headers
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    trustProxy: true,
  })
);
app.use((reg, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static files from Vite build in production
if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Gist.me Backend is running in development mode");
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "operational",
    version: process.env.npm_package_version || "1.0.0",
    environment: NODE_ENV,
  });
});

// MongoDB connection with retry logic
const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(
      `MongoDB connection error (attempt ${retryCount + 1}/${maxRetries}):`,
      err
    );
    if (retryCount < maxRetries) {
      console.log("Retrying in 5 seconds...");
      setTimeout(() => connectDB(retryCount + 1, maxRetries), 5000);
    } else {
      console.error(
        "Max retry attempts reached. Could not connect to MongoDB."
      );
      process.exit(1);
    }
  }
};

// MongoDB connection logging
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully.");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Socket.io error handling
io.on("error", (error) => {
  console.error("Socket.io error:", error.message);
});

io.on("connect_error", (error) => {
  console.warn("Socket.io connection error:", error.message);
});

// Initialize database connection
connectDB();

// Start server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log("Received shutdown signal. Starting graceful shutdown...");

  // Close WebSocket connections
  io.close(() => {
    console.log("Socket.io server closed.");
  });

  // Close server first to stop accepting new connections
  server.close(() => {
    console.log("HTTP server closed. No longer accepting connections.");

    // Close database connection
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
