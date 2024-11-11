import express from "express";
import { signup, login } from "../controllers/authControllers.js";

const router = express.Router();

// Register route
router.post("/signup", signup);

// Login route
router.post("/login", login);

export default router;
