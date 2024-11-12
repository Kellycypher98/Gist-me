import express from "express";
import Room from "../models/Rooms.js";
import Message from "../models/Messages.js";
import crypto from "crypto";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().populate("createdBy", "username email");
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
});

// Create a new room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const room = new Room({
      name,
      createdBy: req.user.id, // This comes from the auth middleware
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Failed to create room" });
  }
});

// Generate room invites
router.post("/:roomId/invite", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: "Invalid emails array" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Optional: Check if the user is the room creator
    if (room.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only room creator can send invites" });
    }

    const invitationLinks = emails.map((email) => {
      const inviteToken = crypto.randomBytes(16).toString("hex");
      const inviteLink = `${process.env.FRONTEND_URL}/join-room/${roomId}?token=${inviteToken}`;

      room.invites.push({ email, inviteToken });
      return { email, inviteLink };
    });

    await room.save();
    res.json({ message: "Invitations generated!", invitationLinks });
  } catch (error) {
    console.error("Error generating invitations:", error);
    res.status(500).json({ message: "Failed to send invitations" });
  }
});

// Get messages for a room
router.get("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Edit message in a room
router.put("/:roomId/messages/:messageId", async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { newText } = req.body;

    // Validate input
    if (!newText || !newText.trim()) {
      return res.status(400).json({ message: "New message text is required" });
    }

    // Find message and update text
    const message = await Message.findOneAndUpdate(
      { _id: messageId, roomId },
      { text: newText.trim(), edited: true, updatedAt: Date.now() },
      { new: true }
    ).populate("sender", "username"); // Populate sender info for updated response

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message updated successfully", data: message });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Failed to update message" });
  }
});

// Delete message in a room
router.delete("/:roomId/messages/:messageId", async (req, res) => {
  try {
    const { roomId, messageId } = req.params;

    // Find and delete the message
    const message = await Message.findOneAndDelete({ _id: messageId, roomId });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// Create a new message in a room
router.post("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Create and save the message
    const message = new Message({
      roomId,
      text: text.trim(),
      sender: req.user.id, // From auth middleware
    });

    await message.save();

    // Populate sender information before sending response
    await message.populate("sender", "username");

    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to create message" });
  }
});

export default router;
