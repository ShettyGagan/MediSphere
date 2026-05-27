import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  joinConsultation,
  endConsultation,
} from "../controllers/consultationController.js";

const router = express.Router();

router.use(protect);

// Join a scheduled video consultation
router.get("/join/:appointmentId", joinConsultation);

// End consultation (doctor only)
router.post("/end/:appointmentId", restrictTo("DOCTOR"), endConsultation);

export default router;
