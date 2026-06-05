import mongoose from "mongoose";
import User from "../models/User.js";
import DoctorProfile from "../models/Doctor.js";
import { generateToken } from "../utils/jwt.js";
import { upsertStreamUser } from "../utils/stream.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies.js";
import { ENV } from "../utils/env.js";

// Helper: Finalize registration (Stream + Token + Response)
const finalizeRegistration = async (res, user) => {
  await upsertStreamUser({
    id: user._id.toString(),
    name: user.name,
    image: user.profileImage || "",
  });

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({ user: userResponse });
};

// Helper: Validate common registration fields
const validateRegistrationFields = (name, email, password) => {
  if (!name || !email || !password) {
    return "Name, email, and password are required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }
  return null;
};

// Patient Register
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const validationError = validateRegistrationFields(name, email, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "PATIENT",
      authProvider: "email",
    });

    await finalizeRegistration(res, user);
  } catch (error) {
    console.error("Register Patient Error:", error);
    res.status(500).json({ message: "Patient registration failed" });
  }
};

// Doctor Register
export const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      qualification,
      experience_years,
      consultation_fee,
    } = req.body;

    const validationError = validateRegistrationFields(name, email, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!specialization || !consultation_fee) {
      return res.status(400).json({
        message: "Specialization and consultation fee are required",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "DOCTOR",
      authProvider: "email",
    });

    await DoctorProfile.create({
      user_id: user._id,
      specialization,
      qualification,
      experience_years: experience_years || 0,
      consultation_fee,
    });

    await finalizeRegistration(res, user);
  } catch (error) {
    console.error("Register Doctor Error:", error);
    res.status(500).json({ message: "Doctor registration failed" });
  }
};





// User Login

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.authProvider !== "email") {
      return res.status(400).json({ message: "Use Google login instead" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Keep Stream user profile in sync on every login
    await upsertStreamUser({
      id: user._id.toString(),
      name: user.name,
      image: user.profileImage || "",
    });

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};


// Google OAuth Success

export const googleAuthSuccess = async (req, res) => {
  try {
    await upsertStreamUser({
      id: req.user._id.toString(),
      name: req.user.name,
      image: req.user.profileImage || "",
    });

    const token = generateToken(req.user._id);
    setAuthCookie(res, token);

    res.redirect(`${ENV.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};


// Logout

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
};


// Get Current User

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let doctorProfile = null;
    if (user.role === "DOCTOR") {
      doctorProfile = await DoctorProfile.findOne({ user_id: user._id });
    }

    res.json({ user, doctorProfile });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
