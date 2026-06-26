import mongoose from "mongoose";

// Tracks earnings, withdrawals, and bank details for each doctor
const doctorWalletSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Running balance available to withdraw (in INR)
    available_balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total lifetime earnings (never decremented)
    total_earned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total lifetime withdrawn
    total_withdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Doctor's registered bank account (for payouts)
    bank_account: {
      account_number: { type: String, trim: true },
      ifsc_code:      { type: String, trim: true, uppercase: true },
      account_name:   { type: String, trim: true },
      bank_name:      { type: String, trim: true },
      is_verified:    { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("DoctorWallet", doctorWalletSchema);
