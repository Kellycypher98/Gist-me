import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware
router.use(protect);

import fs from "fs";
const uploadDir = "./uploads/profile-pics";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Ensure we have a valid userId
    const userId = req.params.id || "default";
    cb(null, `${userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
}).single("profilePic");

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "username email profilePic"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update username
router.put("/:id/username", async (req, res) => {
  const { newUsername } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = newUsername;
    await user.save();

    res.json({
      message: "Username updated successfully",
      username: user.username,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ message: "Failed to update username" });
  }
});

// Change password
router.put("/:id/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// Add or update profile picture
router.put("/:id/profile-pic", protect, (req, res) => {
  // Add error handling for undefined ID
  if (!req.params.id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  upload(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      // Check if file exists
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Find and update user
      const user = await User.findById(req.params.id);
      if (!user) {
        // Clean up uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "User not found" });
      }

      // Delete old profile picture if it exists
      if (user.profilePicture) {
        const oldPath = path.join(
          uploadDir,
          path.basename(user.profilePicture)
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update user profile picture path
      user.profilePicture = `/uploads/profile-pics/${req.file.filename}`;
      await user.save();

      res.json({
        message: "Profile picture updated successfully",
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      console.error("Error in profile picture upload:", error);
      // Clean up uploaded file in case of error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Server error during upload" });
    }
  });
});

export default router;
