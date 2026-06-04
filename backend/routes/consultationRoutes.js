import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  joinConsultation,
  endConsultation,
} from "../controllers/consultationController.js";

const router = express.Router();

router.use(protect);

// Join a video consultation
router.get("/join/:appointmentId", joinConsultation);

// End consultation 
router.post("/end/:appointmentId", restrictTo("DOCTOR"), endConsultation);

export default router;
