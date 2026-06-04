import { streamClient, chatClient } from "../utils/stream.js";
import Appointment from "../models/Appointment.js";

const POPULATE_FIELDS = [
  { path: "patient_id", select: "name email profileImage" },
  { path: "doctor_id", select: "name email profileImage" },
];


export const createConsultationSession = async (appointment) => {
  const callId = `consultation_${appointment._id}`;
  const chatChannelId = `chat_${appointment._id}`;

  // Create Stream video call
  await streamClient.video.call("default", callId).getOrCreate({
    data: {
      created_by_id: appointment.doctor_id.toString(),
      members: [
        { user_id: appointment.doctor_id.toString(), role: "admin" },
        { user_id: appointment.patient_id.toString() },
      ],
      custom: {
        appointmentId: appointment._id.toString(),
        scheduledAt: appointment.scheduled_at.toISOString(),
      },
    },
  });

  // Create Stream chat channel 
  const channel = chatClient.channel("messaging", chatChannelId, {
    name: "Consultation Chat",
    created_by_id: appointment.doctor_id.toString(),
    members: [
      appointment.doctor_id.toString(),
      appointment.patient_id.toString(),
    ],
    appointment_id: appointment._id.toString(),
  });
  await channel.create();

  return callId;
};


export const joinConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
      .populate(POPULATE_FIELDS);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isDoctor = appointment.doctor_id._id.toString() === userId.toString();
    const isPatient = appointment.patient_id._id.toString() === userId.toString();

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ message: "Not authorized to join this consultation" });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({ message: "This appointment has been cancelled" });
    }

    if (!appointment.stream_channel_id) {
      return res.status(400).json({ message: "Session not yet created for this appointment" });
    }

    const chatChannelId = `chat_${appointmentId}`;
    const chatChannel = chatClient.channel("messaging", chatChannelId, {
      name: "Consultation Chat",
      created_by_id: appointment.doctor_id._id.toString(),
      members: [
        appointment.doctor_id._id.toString(),
        appointment.patient_id._id.toString(),
      ],
      appointment_id: appointmentId,
    });
    await chatChannel.create();

    res.status(200).json({
      appointment,
      callId: appointment.stream_channel_id,
      chatChannelId,
      role: isDoctor ? "doctor" : "patient",
    });
  } catch (error) {
    console.error("Error joining consultation:", error.message);
    res.status(500).json({ message: "Failed to join consultation" });
  }
};



//End consultation 

export const endConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user._id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor_id: doctorId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({ message: "Consultation already ended" });
    }

    if (appointment.stream_channel_id) {
      try {
        await streamClient.video.call("default", appointment.stream_channel_id).end();
      } catch (err) {
        console.warn("Failed to end Stream call:", err.message);
      }
    }

    appointment.status = "COMPLETED";
    await appointment.save();

    res.status(200).json({
      appointment,
      message: "Consultation ended successfully",
    });
  } catch (error) {
    console.error("Error ending consultation:", error.message);
    res.status(500).json({ message: "Failed to end consultation" });
  }
};
