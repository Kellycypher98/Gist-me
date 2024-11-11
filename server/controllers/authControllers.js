import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Signup User
export const signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validation logging
    console.log("Received signup request:", {
      email,
      username,
      passwordLength: password?.length,
    });

    // Check if all required fields are provided
    if (!email || !username || !password) {
      console.log("Missing required fields:", {
        email: !!email,
        username: !!username,
        password: !!password,
      });
      return res.status(400).json({
        status: "error",
        message: "Username, email, and password are required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    // Check if the username or email already exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      console.log("User already exists:", { username, email });
      return res.status(400).json({
        status: "error",
        message: "Username or email already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();
    console.log("New user created:", { userId: newUser._id, username });

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({
        status: "error",
        message: "Server configuration error",
      });
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Remove password from response
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };

    // Send success response
    res.status(201).json({
      status: "success",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Server error during signup",
    });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation logging
    console.log("Received login request for username:", username);

    // Check if credentials are provided
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log("Login failed: User not found:", username);
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Login failed: Invalid password for user:", username);
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({
        status: "error",
        message: "Server configuration error",
      });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    console.log("Login successful for user:", username);

    // Send success response
    res.status(200).json({
      status: "success",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Server error during login",
    });
  }
};
