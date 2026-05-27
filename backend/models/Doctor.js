import mongoose from "mongoose";

const doctorSchema=mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per doctor
      index: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    qualification: {
      type: String,
      trim: true,
    },

    experience_years: {
      type: Number,
      min: 0,
      default: 0,
    },

    consultation_fee: {
      type: Number,
      required: true,
      min: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    total_reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("DoctorProfile", doctorSchema);