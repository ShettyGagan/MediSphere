import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      // stored as YYYY-MM-DD string 
      type: String,
      required: true,
      index: true,
    },
    start_time: {
      // "HH:MM" 24-hour format
      type: String,
      required: true,
    },
    end_time: {
      // start time + 15 minutes
      type: String,
      required: true,
    },
    is_booked: {
      type: Boolean,
      default: false,
      index: true,
    },
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// doctor can  have one slot at a given date+time
slotSchema.index({ doctor_id: 1, date: 1, start_time: 1 }, { unique: true });

export default mongoose.model("Slot", slotSchema);
