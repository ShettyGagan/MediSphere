import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  bookAppointment,
  verifyPayment,
  getMyAppointments,
  getUpcomingAppointments,
  getAppointmentById,
  cancelAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

// All protected routes 
router.use(protect);

// Book appointment & payment 
router.post("/book", restrictTo("PATIENT"), bookAppointment);
router.post("/verify-payment", restrictTo("PATIENT"), verifyPayment);

// Get appointments
router.get("/my-appointments", getMyAppointments);
router.get("/upcoming", getUpcomingAppointments);
router.get("/:id", getAppointmentById);

// Cancel appointment
router.patch("/:id/cancel", cancelAppointment);

export default router;
