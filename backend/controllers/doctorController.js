import DoctorProfile from "../models/Doctor.js";

// Get all doctors with their profile info 
export const getAllDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    const filter = {};
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    const doctors = await DoctorProfile.find(filter)
      .populate("user_id", "name email profileImage")
      .sort({ rating: -1 })
      .lean();

    res.json({ doctors });
  } catch {
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};

// Get a doctor's profile by their user ID 
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user_id: req.params.id })
      .populate("user_id", "name email profileImage")
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ doctor });
  } catch {
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
};
