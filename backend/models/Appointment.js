import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    appointment_type: {
      type: String,
      enum: ["VIDEO", "CHAT"],
      required: true,
    },

    scheduled_at: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    consultation_fee: {
      type: Number,
      required: true,
      min: 0,
    },

    stream_channel_id: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent exact double booking
appointmentSchema.index(
  { doctor_id: 1, scheduled_at: 1 },
  { unique: true }
);

export default mongoose.model("Appointment", appointmentSchema);
