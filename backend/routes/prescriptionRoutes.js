import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  createPrescription,
  updatePrescription,
  getPrescriptionByAppointment,
  getMyPrescriptions,
  getPrescriptionById,
  deletePrescription,
} from "../controllers/prescriptionController.js";

const router = express.Router();

// All protected routes `
router.use(protect);

// Doctor creates/updates prescription
router.post("/appointment/:appointmentId", restrictTo("DOCTOR"), createPrescription);
router.patch("/:id", restrictTo("DOCTOR"), updatePrescription);
router.delete("/:id", restrictTo("DOCTOR"), deletePrescription);

// Get prescriptions
router.get("/my-prescriptions", getMyPrescriptions);
router.get("/appointment/:appointmentId", getPrescriptionByAppointment);
router.get("/:id", getPrescriptionById);

export default router;
