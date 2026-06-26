import mongoose from "mongoose";

// Ledger of every withdrawal attempt by a doctor
const withdrawalRequestSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 100, // minimum withdrawal ₹100
    },

    // Cashfree transfer_id returned after initiating payout
    cashfree_transfer_id: {
      type: String,
      default: null,
    },

    // UTR / reference number after settlement
    utr: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },

    failure_reason: {
      type: String,
      default: null,
    },

    // Snapshot of bank account used at the time of withdrawal
    bank_snapshot: {
      account_number: String,
      ifsc_code:      String,
      account_name:   String,
      bank_name:      String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
