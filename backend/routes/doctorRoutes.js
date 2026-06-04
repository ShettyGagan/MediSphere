import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getAllDoctors, getDoctorById } from "../controllers/doctorController.js";

const router = express.Router();

router.use(protect);

// List all doctors
router.get("/", getAllDoctors);

// Get a specific doctor's profile
router.get("/:id", getDoctorById);

export default router;
