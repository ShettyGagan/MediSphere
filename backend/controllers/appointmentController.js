import mongoose from "mongoose";
import crypto from "crypto";
import Appointment from "../models/Appointment.js";
import Payment from "../models/payment.js";
import DoctorProfile from "../models/Doctor.js";
import User from "../models/User.js";
import Slot from "../models/Slot.js";
import { createConsultationSession } from "./consultationController.js";
import { ENV } from "../utils/env.js";


//  CASHFREE HELPERS

const CASHFREE_BASE =
  ENV.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const cashfreeHeaders = {
  "x-api-version": "2023-08-01",
  "x-client-id": ENV.CASHFREE_APP_ID,
  "x-client-secret": ENV.CASHFREE_SECRET_KEY,
  "Content-Type": "application/json",
};

// Creating  a Cashfree order  
const createCashfreeOrder = async ({ orderId, amount, patient }) => {
  const body = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: patient._id.toString(),
      customer_name: patient.name,
      customer_email: patient.email,
      customer_phone: patient.phone || "9999999999",
    },
    order_meta: {
      return_url: `${ENV.CLIENT_URL}/dashboard/appointments?cf_order_id={order_id}`,
    },
  };

  console.log("Cashfree create order request:", JSON.stringify(body, null, 2));
  console.log("Cashfree headers:", { "x-client-id": ENV.CASHFREE_APP_ID, "x-api-version": "2023-08-01" });

  const response = await fetch(`${CASHFREE_BASE}/orders`, {
    method: "POST",
    headers: cashfreeHeaders,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  console.log("Cashfree response status:", response.status);
  console.log("Cashfree response body:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data) || "Failed to create Cashfree order");
  }

  return data;
};

// Fetching Cashfree order status for payment verification 
const getCashfreeOrderStatus = async (orderId) => {
  const response = await fetch(`${CASHFREE_BASE}/orders/${orderId}`, {
    method: "GET",
    headers: cashfreeHeaders,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Cashfree order status error:", data);
    throw new Error(data.message || "Failed to fetch Cashfree order status");
  }

  return data;
};

// Get payments list for a Cashfree order 
const getCashfreePayments = async (orderId) => {
  const response = await fetch(`${CASHFREE_BASE}/orders/${orderId}/payments`, {
    method: "GET",
    headers: cashfreeHeaders,
  });

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

// POPULATING FIELDS 
const POPULATE_FIELDS = [
  { path: "patient_id", select: "name email profileImage phone" },
  { path: "doctor_id", select: "name email profileImage" },
];


//booking appointment

export const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_type, scheduled_at, slot_id } = req.body;
    const patient_id = req.user._id;

    if (
      !doctor_id ||
      !scheduled_at ||
      !["VIDEO", "CHAT"].includes(appointment_type)
    ) {
      return res.status(400).json({ message: "Invalid appointment data" });
    }

    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: "Time must be in the future" });
    }

    const doctorProfile = await DoctorProfile.findOne({ user_id: doctor_id }).lean();
    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // validate free slot
    let slot = null;
    if (slot_id) {
      slot = await Slot.findOne({
        _id: slot_id,
        doctor_id,
        is_booked: false,
      });
      if (!slot) {
        return res.status(409).json({ message: "This slot is no longer available" });
      }
    } else {

      const existing = await Appointment.findOne({
        doctor_id,
        scheduled_at: scheduledDate,
        status: { $nin: ["CANCELLED"] },
      });
      if (existing) {
        return res.status(409).json({ message: "Time slot already booked" });
      }
    }

    // Fetching details of patient for Cashfree customer info
    const patient = await User.findById(patient_id).lean();
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Create appointment first to get the ID
    const appointment = await Appointment.create({
      patient_id,
      doctor_id,
      appointment_type,
      scheduled_at: scheduledDate,
      consultation_fee: doctorProfile.consultation_fee,
      status: "PENDING",
    });


    if (slot) {
      await Slot.findByIdAndUpdate(slot._id, {
        is_booked: true,
        appointment_id: appointment._id,
      });
    }

    //  unique Cashfree order ID using appointment ID
    const cfOrderId = `health_${appointment._id}`;

    let cfOrder;
    try {
      cfOrder = await createCashfreeOrder({
        orderId: cfOrderId,
        amount: doctorProfile.consultation_fee,
        patient,
      });
    } catch (cfErr) {
      // Rollback: delete the appointment AND release the slot 
      await Appointment.findByIdAndDelete(appointment._id);
      if (slot) {
        await Slot.findByIdAndUpdate(slot._id, { is_booked: false, appointment_id: null });
      }
      return res.status(502).json({ message: `Payment gateway error: ${cfErr.message}` });
    }

    // Save payment record
    await Payment.create({
      user_id: patient_id,
      appointment_id: appointment._id,
      amount: doctorProfile.consultation_fee,
      cashfree_order_id: cfOrderId,
      status: "PENDING",
    });

    const populated = await Appointment.findById(appointment._id)
      .populate(POPULATE_FIELDS)
      .lean();

    res.status(201).json({
      appointment: populated,
      payment: {
        paymentSessionId: cfOrder.payment_session_id,
        cfOrderId,
        amount: doctorProfile.consultation_fee,
        env: ENV.CASHFREE_ENV,
      },
    });
  } catch (error) {
    console.error("Book Appointment Error:", error);
    res.status(500).json({ message: error.message || "Booking failed" });
  }
};


// Verify Payment 

export const verifyPayment = async (req, res) => {
  try {
    const { cf_order_id } = req.body;

    if (!cf_order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Verify order status with Cashfree
    const cfOrder = await getCashfreeOrderStatus(cf_order_id);

    if (cfOrder.order_status !== "PAID") {
      return res.status(400).json({
        message: `Payment not completed. Status: ${cfOrder.order_status}`,
      });
    }

    // Get the actual payment ID from Cashfree
    const payments = await getCashfreePayments(cf_order_id);
    const successfulPayment = payments.find(p => p.payment_status === "SUCCESS");
    const cfPaymentId = successfulPayment?.cf_payment_id?.toString() || null;

    // Find our payment record
    const payment = await Payment.findOneAndUpdate(
      { cashfree_order_id: cf_order_id, status: "PENDING" },
      {
        status: "COMPLETED",
        cashfree_payment_id: cfPaymentId,
      },
      { new: true }
    );

    if (!payment) {
      // If already processed, find the existing payment
      const existingPayment = await Payment.findOne({ cashfree_order_id: cf_order_id });
      if (existingPayment && existingPayment.status === "COMPLETED") {
        return res.status(400).json({ message: "Payment already processed" });
      }
      return res.status(400).json({ message: "Payment record not found" });
    }

    // Ownership check
    if (payment.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const appointment = await Appointment.findById(payment.appointment_id);
    if (!appointment || appointment.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid appointment state" });
    }

    appointment.status = "CONFIRMED";
    await appointment.save();

    // create stream video call 
    try {
      const callId = await createConsultationSession(appointment);
      appointment.stream_channel_id = callId;
      await appointment.save();
    } catch (streamError) {
      console.error("Stream session creation failed:", streamError.message);
    }

    const populated = await Appointment.findById(appointment._id)
      .populate(POPULATE_FIELDS)
      .lean();

    res.json({
      appointment: populated,
      ...(appointment.stream_channel_id
        ? { callId: appointment.stream_channel_id }
        : { warning: "Video session pending setup" }),
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ message: "Verification error" });
  }
};

// GET MY APPOINTMENTS 

export const getMyAppointments = async (req, res) => {
  try {
    const { status } = req.query;

    const query =
      req.user.role === "DOCTOR"
        ? { doctor_id: req.user._id }
        : { patient_id: req.user._id };

    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate(POPULATE_FIELDS)
      .sort({ scheduled_at: -1 })
      .lean();

    res.json({ appointments });
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// CANCEL APPOINTMENT 

export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ["PENDING", "CONFIRMED"] },
        $or: [
          { doctor_id: req.user._id },
          { patient_id: req.user._id }
        ]
      },
      { status: "CANCELLED" },
      { new: true }
    ).lean();

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found or non-cancellable",
      });
    }

    res.json({
      message: "Cancelled successfully",
      appointment,
    });
  } catch {
    res.status(500).json({ message: "Cancellation failed" });
  }
};

// GET UPCOMING APPOINTMENTS 

export const getUpcomingAppointments = async (req, res) => {
  try {
    const query = {
      scheduled_at: { $gte: new Date() },
      status: { $in: ["PENDING", "CONFIRMED"] },
      ...(req.user.role === "DOCTOR"
        ? { doctor_id: req.user._id }
        : { patient_id: req.user._id }),
    };

    const appointments = await Appointment.find(query)
      .populate(POPULATE_FIELDS)
      .sort({ scheduled_at: 1 })
      .lean();

    res.json({ appointments });
  } catch {
    res.status(500).json({ message: "Failed to fetch upcoming appointments" });
  }
};

// GET APPOINTMENT BY ID 

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      $or: [
        { doctor_id: req.user._id },
        { patient_id: req.user._id },
      ],
    })
      .populate(POPULATE_FIELDS)
      .lean();

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ appointment });
  } catch {
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
};
