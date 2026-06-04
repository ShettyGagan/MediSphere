import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  setSlots,
  deleteSlot,
  getMySlots,
  getAvailableSlots,
} from "../controllers/slotController.js";

const router = express.Router();

router.use(protect);

// Doctor routes
router.post("/set", restrictTo("DOCTOR"), setSlots);
router.delete("/:id", restrictTo("DOCTOR"), deleteSlot);
router.get("/my", restrictTo("DOCTOR"), getMySlots);

// available slots
router.get("/available", getAvailableSlots);

export default router;
