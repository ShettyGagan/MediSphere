
import Appointment from "../models/Appointment.js";
import Payment from "../models/payment.js";
import User from "../models/User.js";
import DoctorProfile from "../models/Doctor.js";
import Slot from "../models/Slot.js";
import { createCashfreeOrder, getCashfreeOrder, getCashfreePayments } from "../utils/cashfree.js";
import { createConsultationSession } from "../controllers/consultationController.js";

export const POPULATE_FIELDS = [
    { path: "patient_id", select: "name email profileImage phone" },
    { path: "doctor_id", select: "name email profileImage" },
];


//Booking Appointment

export const initiateBooking = async ({ patientId, doctor_id, appointment_type, scheduled_at, slot_id }) => {
    const scheduledDate = new Date(scheduled_at);

    if (scheduledDate <= new Date()) {
        throw Object.assign(new Error("Scheduled date must be in the future."), {
            status: 400
        });
    }

    const [doctorProfile, patient] = await Promise.all([
        DoctorProfile.findOne({ user_id: doctor_id }).lean(),
        User.findById(patientId).lean(),
    ]);

    if (!doctorProfile) throw Object.assign(new Error("Doctor not found"), { status: 404 });
    if (!patient) throw Object.assign(new Error("Patient not found"), { status: 404 });


    const slot = slot_id ? await Slot.findOneAndUpdate(
        { _id: slot_id, is_booked: false, doctor_id },
        { is_booked: true },
        { new: true }
    ) : null;

    if (slot_id && !slot) {
        throw Object.assign(new Error("This slot is no longer available"), { status: 409 });
    }

    if (!slot_id) {
        const conflict = await Appointment.findOne({
            doctor_id, scheduled_at: scheduledDate,
            status: { $nin: ['CANCELLED'] }
        });

        if (conflict) throw Object.assign(new Error("Time slot already booked"), { status: 409 });
    }

    const appointment = await Appointment.create({
        patient_id: patientId,
        doctor_id,
        appointment_type,
        scheduled_at: scheduledDate,
        consultation_fee: doctorProfile.consultation_fee,
        status: "PENDING"
    });

    if (slot) await Slot.findByIdAndUpdate(slot._id, { appointment_id: appointment._id });



    const cfOrderId = `health_${appointment._id}`;

    let cfOrder;

    try {
        cfOrder = await createCashfreeOrder({
            orderId: cfOrderId,
            amount: doctorProfile.consultation_fee,
            patient
        });
    } catch (err) {
        await Appointment.findByIdAndDelete(appointment._id);
        if (slot) await Slot.findByIdAndUpdate(slot._id, { is_booked: false, appointment_id: null });
        throw Object.assign(new Error(`Payment gateway error: ${err.message}`), { status: 502 });
    }

    await Payment.create({
        user_id: patientId,
        appointment_id: appointment._id,
        amount: doctorProfile.consultation_fee,
        cashfree_order_id: cfOrderId,
        status: "PENDING"
    });

    const populated = await Appointment.findById(appointment._id)
        .populate(POPULATE_FIELDS)
        .lean();

    return {
        appointment: populated,
        payment: {
            paymentSessionId: cfOrder.payment_session_id,
            cfOrderId,
            amount: doctorProfile.consultation_fee,
        },
    };

};

//payment verification

export const confirmPayment = async ({ cfOrderId, userId }) => {
    const cfOrder = await getCashfreeOrder(cfOrderId);

    if (cfOrder.order_status !== "PAID") {
        throw Object.assign(
            new Error(`Payment not completed. Status: ${cfOrder.order_status}`),
            { status: 400 }
        );
    }

    const pendingPayment = await Payment.findOne({
        cashfree_order_id: cfOrderId,
        status: "PENDING",
    });

    if (!pendingPayment) {
        const existing = await Payment.findOne({ cashfree_order_id: cfOrderId });
        if (existing?.status === "COMPLETED") {
            throw Object.assign(new Error("Payment already processed"), { status: 400 });
        }
        throw Object.assign(new Error("Payment record not found"), { status: 404 });
    }

    if (pendingPayment.user_id.toString() !== userId.toString()) {
        throw Object.assign(new Error("Not authorized"), { status: 403 });
    }

    const appointment = await Appointment.findById(pendingPayment.appointment_id);
    if (!appointment || appointment.status !== "PENDING") {
        throw Object.assign(new Error("Invalid appointment state"), { status: 400 });
    }

    // FIX: use findOneAndUpdate for atomic status transition to prevent double-processing
    const payments = await getCashfreePayments(cfOrderId);
    const cfPaymentId =
        payments.find((p) => p.payment_status === "SUCCESS")?.cf_payment_id?.toString() ?? null;

    const payment = await Payment.findOneAndUpdate(
        { _id: pendingPayment._id, status: "PENDING" }, // double-check still pending
        { status: "COMPLETED", cashfree_payment_id: cfPaymentId },
        { new: true }
    );

    if (!payment) {
        throw Object.assign(new Error("Payment already processed"), { status: 400 });
    }

    appointment.status = "CONFIRMED";
    await appointment.save();

    try {
        const callId = await createConsultationSession(appointment);
        appointment.stream_channel_id = callId;
        await appointment.save();
    } catch (err) {
        // Non-fatal: log and continue — video session can be retried
        console.error("Stream session creation failed:", err.message);
    }

    const populated = await Appointment.findById(appointment._id)
        .populate(POPULATE_FIELDS)
        .lean();

    return {
        appointment: populated,
        ...(appointment.stream_channel_id
            ? { callId: appointment.stream_channel_id }
            : { warning: "Video session pending setup" }),
    };
};





export const fetchAppointments = async ({ user, status }) => {
    const query =
        user.role === "DOCTOR"
            ? { doctor_id: user._id }
            : { patient_id: user._id };

    if (status) query.status = status;

    return Appointment.find(query)
        .populate(POPULATE_FIELDS)
        .sort({ scheduled_at: -1 })
        .lean();
};

export const fetchUpcomingAppointments = async (user) => {
    const query = {
        scheduled_at: { $gte: new Date() },
        status: { $in: ["PENDING", "CONFIRMED"] },
        ...(user.role === "DOCTOR"
            ? { doctor_id: user._id }
            : { patient_id: user._id }),
    };

    return Appointment.find(query)
        .populate(POPULATE_FIELDS)
        .sort({ scheduled_at: 1 })
        .lean();
};

export const fetchAppointmentById = async ({ appointmentId, userId }) => {
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        $or: [{ doctor_id: userId }, { patient_id: userId }],
    })
        .populate(POPULATE_FIELDS)
        .lean();

    if (!appointment) {
        throw Object.assign(new Error("Appointment not found"), { status: 404 });
    }

    return appointment;
};

export const cancelAppointmentById = async ({ appointmentId, userId }) => {
    const appointment = await Appointment.findOneAndUpdate(
        {
            _id: appointmentId,
            status: { $in: ["PENDING", "CONFIRMED"] },
            $or: [{ doctor_id: userId }, { patient_id: userId }],
        },
        { status: "CANCELLED" },
        { new: true }
    ).lean();

    if (!appointment) {
        throw Object.assign(new Error("Appointment not found or non-cancellable"), { status: 404 });
    }

    return appointment;
};



