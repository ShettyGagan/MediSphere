import mongoose from "mongoose";

const streamSessionSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true,
    },

    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    callId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },

    started_at: Date,
    ended_at: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("StreamSession", streamSessionSchema);
