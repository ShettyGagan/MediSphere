import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getStreamToken } from "../controllers/chatController.js";

const router = express.Router();

// Get Stream token for chat/video
router.get("/token", protect, getStreamToken);

export default router;
