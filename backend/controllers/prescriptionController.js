import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";

/**
 * Create prescription for a patient after consultation
 * Only the doctor of the appointment can create
 */
export const createPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { diagnosis, medicines, notes } = req.body;
    const doctorId = req.user._id;

    // Verify user is a doctor
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can create prescriptions" });
    }

    // Get appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify this doctor owns the appointment
    if (appointment.doctor_id.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: "Not authorized for this appointment" });
    }

    // Check if prescription already exists
    const existingPrescription = await Prescription.findOne({ appointment_id: appointmentId });
    if (existingPrescription) {
      return res.status(409).json({ 
        message: "Prescription already exists for this appointment",
        prescription: existingPrescription,
      });
    }

    // Validate medicines array
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "At least one medicine is required" });
    }

    // Validate each medicine has a name
    for (const medicine of medicines) {
      if (!medicine.name?.trim()) {
        return res.status(400).json({ message: "Medicine name is required" });
      }
    }

    // Create prescription
    const prescription = await Prescription.create({
      appointment_id: appointmentId,
      patient_id: appointment.patient_id,
      doctor_id: doctorId,
      diagnosis,
      medicines,
      notes,
    });

    // Mark appointment as COMPLETED
    appointment.status = "COMPLETED";
    await appointment.save();

    // Populate for response
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate("patient_id", "name email profileImage")
      .populate("doctor_id", "name email profileImage")
      .populate("appointment_id", "appointment_type scheduled_at");

    res.status(201).json({
      prescription: populatedPrescription,
      message: "Prescription created successfully",
    });
  } catch (error) {
    console.error("Error creating prescription:", error.message);
    res.status(500).json({ message: "Failed to create prescription" });
  }
};

/**
 * Update an existing prescription
 * Only the doctor who created it can update
 */
export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, medicines, notes } = req.body;
    const doctorId = req.user._id;

    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can update prescriptions" });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Verify this doctor owns the prescription
    if (prescription.doctor_id.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this prescription" });
    }

    // Update fields
    if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
    if (notes !== undefined) prescription.notes = notes;
    if (medicines && Array.isArray(medicines) && medicines.length > 0) {
      // Validate medicines
      for (const medicine of medicines) {
        if (!medicine.name?.trim()) {
          return res.status(400).json({ message: "Medicine name is required" });
        }
      }
      prescription.medicines = medicines;
    }

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate("patient_id", "name email profileImage")
      .populate("doctor_id", "name email profileImage")
      .populate("appointment_id", "appointment_type scheduled_at");

    res.status(200).json({
      prescription: populatedPrescription,
      message: "Prescription updated successfully",
    });
  } catch (error) {
    console.error("Error updating prescription:", error.message);
    res.status(500).json({ message: "Failed to update prescription" });
  }
};

/**
 * Get prescription by appointment ID
 * Both doctor and patient of the appointment can view
 */
export const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify user is part of this appointment
    const isAuthorized =
      appointment.doctor_id.toString() === userId.toString() ||
      appointment.patient_id.toString() === userId.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const prescription = await Prescription.findOne({ appointment_id: appointmentId })
      .populate("patient_id", "name email profileImage")
      .populate("doctor_id", "name email profileImage")
      .populate("appointment_id", "appointment_type scheduled_at");

    if (!prescription) {
      return res.status(404).json({ message: "No prescription found for this appointment" });
    }

    res.status(200).json({ prescription });
  } catch (error) {
    console.error("Error fetching prescription:", error.message);
    res.status(500).json({ message: "Failed to fetch prescription" });
  }
};

/**
 * Get all prescriptions for the logged-in patient
 */
export const getMyPrescriptions = async (req, res) => {
  try {
    const userId = req.user._id;

    // Build query based on role
    const query = req.user.role === "DOCTOR" 
      ? { doctor_id: userId }
      : { patient_id: userId };

    const prescriptions = await Prescription.find(query)
      .populate("patient_id", "name email profileImage")
      .populate("doctor_id", "name email profileImage")
      .populate("appointment_id", "appointment_type scheduled_at status")
      .sort({ createdAt: -1 });

    res.status(200).json({ prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error.message);
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
};

/**
 * Get a single prescription by ID
 */
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const prescription = await Prescription.findById(id)
      .populate("patient_id", "name email profileImage")
      .populate("doctor_id", "name email profileImage")
      .populate("appointment_id", "appointment_type scheduled_at status");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Verify user is part of this prescription
    const isAuthorized =
      prescription.doctor_id._id.toString() === userId.toString() ||
      prescription.patient_id._id.toString() === userId.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized to view this prescription" });
    }

    res.status(200).json({ prescription });
  } catch (error) {
    console.error("Error fetching prescription:", error.message);
    res.status(500).json({ message: "Failed to fetch prescription" });
  }
};

/**
 * Delete a prescription
 * Only the doctor who created it can delete
 */
export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can delete prescriptions" });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (prescription.doctor_id.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this prescription" });
    }

    await Prescription.findByIdAndDelete(id);

    res.status(200).json({ message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("Error deleting prescription:", error.message);
    res.status(500).json({ message: "Failed to delete prescription" });
  }
};
