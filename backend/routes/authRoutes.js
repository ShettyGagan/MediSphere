import express from "express";
import passport from "../utils/passport.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  registerPatient,
  registerDoctor,
  login,
  logout,
  getMe,
  googleAuthSuccess,
} from "../controllers/authController.js";

const router = express.Router();

// Registration
router.post("/register/patient", registerPatient);
router.post("/register/doctor", registerDoctor);

// Login/Logout
router.post("/login", login);
router.post("/logout", logout);

// Current user
router.get("/me", protect, getMe);

// Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"],
}));

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleAuthSuccess
);

export default router;
