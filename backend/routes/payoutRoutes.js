import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  getWallet,
  saveBankAccount,
  requestWithdrawal,
  getWithdrawalStatus,
} from "../controllers/payoutController.js";

const router = express.Router();

// All payout routes require authentication and DOCTOR role
router.use(protect, restrictTo("DOCTOR"));

// GET    /api/payouts/wallet          — earnings summary + withdrawal history
router.get("/wallet", getWallet);

// PUT    /api/payouts/bank-account    — add / update bank account
router.put("/bank-account", saveBankAccount);

// POST   /api/payouts/withdraw        — initiate payout
router.post("/withdraw", requestWithdrawal);

// GET    /api/payouts/withdrawal/:id/status — poll a specific withdrawal
router.get("/withdrawal/:id/status", getWithdrawalStatus);

export default router;
