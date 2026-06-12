import mongoose from "mongoose";
import crypto from "crypto";
import {
  initiateBooking,
  confirmPayment,
  fetchAppointmentById,
  fetchAppointments,
  cancelAppointmentById,
  fetchUpcomingAppointments
} from "../services/appointmentService.js"
import { ENV } from "../utils/env.js";

//wrapper for errors to HTTP response
const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    return result;
  } catch (err) {
    const status = err.status || 500;
    const message = status < 500 ? err.message : "An unexpected error occurred";
    if (status >= 500) console.error(err);
    return res.status(status).json({ message });
  }
};

//booking appointment

export const bookAppointment = handle(async (req, res) => {
  const { doctor_id, appointment_type, scheduled_at, slot_id } = req.body;
  const patient_id = req.user._id;

  if (
    !doctor_id ||
    !scheduled_at ||
    !["VIDEO", "CHAT"].includes(appointment_type)
  ) {
    return res.status(400).json({ message: "Invalid appointment data" });
  }

  const result = await initiateBooking({
    patientId: patient_id,
    doctor_id,
    appointment_type,
    scheduled_at,
    slot_id,
  });

  return res.status(201).json({
    appointment: result.appointment,
    payment: {
      paymentSessionId: result.payment.paymentSessionId,
      cfOrderId: result.payment.cfOrderId,
      amount: result.payment.amount,
      env: ENV.CASHFREE_ENV,
    },
  });

});


// Verify Payment 

export const verifyPayment = handle(async (req, res) => {
  const { cf_order_id } = req.body;

  if (!cf_order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  const result = await confirmPayment({
    cfOrderId: cf_order_id, userId: req.user._id
  })

  return res.json(result);

});

// GET MY APPOINTMENTS 

export const getMyAppointments = handle(async (req, res) => {
  const appointments = await fetchAppointments({
    user: req.user,
    status: req.query.status,
  })

  return res.json({ appointments });

});

// CANCEL APPOINTMENT 

export const cancelAppointment = handle(async (req, res) => {

  const result = await cancelAppointmentById({
    appointmentId: req.params.id,
    userId: req.user._id
  })
  return res.json({ message: "Cancelled successfully", appointment });

});

// GET UPCOMING APPOINTMENTS 

export const getUpcomingAppointments = async (req, res) => {
  const appointments = await fetchUpcomingAppointments(req.user);
  return res.json({ appointments });
};

// GET APPOINTMENT BY ID 

export const getAppointmentById = async (req, res) => {
  const appointment = await fetchAppointmentById({
    appointmentId: req.params.id,
    userId: req.user._id,
  });
  return res.json({ appointment });
};
