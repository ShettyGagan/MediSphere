import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { load } from '@cashfreepayments/cashfree-js';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Video,
  MessageSquare,
  Loader2,
  ShieldCheck,
  CreditCard,
  User,
  Star,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const appointmentType = 'VIDEO';
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${doctorId}`);
        setDoctor(res.data.doctor);
      } catch (err) {
        console.error('Failed to fetch doctor:', err);
        setError('Could not load doctor details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    if (doctorId) fetchDoctor();
  }, [doctorId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Please select both a date and time.');
      return;
    }
    setError('');
    setBooking(true);

    try {
      // Step 1: Create appointment + Cashfree order on backend
      const scheduledAt = new Date(`${date}T${time}`);
      const res = await api.post('/appointments/book', {
        doctor_id: doctorId,
        appointment_type: appointmentType,
        scheduled_at: scheduledAt.toISOString(),
      });

      const { appointment, payment } = res.data;

      // Step 2: Initialise Cashfree JS SDK
      const cashfree = await load({
        mode: payment.env === 'production' ? 'production' : 'sandbox',
      });

      // Step 3: Open Cashfree checkout modal
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: payment.paymentSessionId,
        redirectTarget: '_modal',
      });

      // checkout() resolves when the modal closes (success or abort)
      if (checkoutResult?.error) {
        // User cancelled or payment failed inside modal
        const msg = checkoutResult.error.message || 'Payment was not completed.';
        setError(msg);
        setBooking(false);
        return;
      }

      // Step 4: Verify payment with our backend
      await api.post('/appointments/verify-payment', {
        cf_order_id: payment.cfOrderId,
      });

      // Step 5: Navigate to appointments list with success flag
      navigate(`/dashboard/appointments?success=true&id=${appointment._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Booking failed. Please try again.';
      setError(msg);
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#2a7d5f]" />
    </div>
  );

  if (!doctor) return (
    <div className="text-center py-24">
      <AlertCircle className="w-12 h-12 text-[#b91c1c] mx-auto mb-4" />
      <h3 className="text-[18px] font-medium text-[#1a3d30] mb-2">Doctor not found</h3>
      <Link to="/doctors" className="text-[#2a7d5f] font-medium hover:underline text-[14px]">Go back to search</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-500 pb-12 bg-[#f0f7f4]">
      <button
        onClick={() => navigate('/doctors')}
        className="mb-8 flex items-center gap-2 text-[#4a7a67] hover:text-[#2a7d5f] font-medium transition-colors group text-[14px]"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to expert listing
      </button>

      <div className="grid md:grid-cols-5 gap-8">
        {/* ── Left – Booking Form ── */}
        <section className="md:col-span-3 space-y-6 order-2 md:order-1">
          <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[10px] p-8">
            <h2 className="text-[20px] font-medium text-[#1a3d30] mb-8 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#2a7d5f]" />
              Book your consultation
            </h2>

            <form onSubmit={handleBooking} className="space-y-8">
              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[#b91c1c]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[13px] font-normal">{error}</p>
                </div>
              )}

              {/* Consultation includes both video & chat */}
              <div className="flex items-center gap-4 p-4 bg-[#f0f7f4] rounded-lg border border-[#c5e3d8]">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#2a7d5f]" />
                  <MessageSquare className="w-4 h-4 text-[#4a7a67]" />
                </div>
                <p className="text-[13px] font-normal text-[#2e5e4a]">
                  Every consultation includes <span className="font-medium text-[#1a3d30]">live video</span> and <span className="font-medium text-[#1a3d30]">in-call chat</span> together.
                </p>
              </div>

              {/* Date & Time */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">
                    Preferred date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7a67]" />
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-field pl-11 text-[14px]"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">
                    Preferred time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7a67]" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="input-field pl-11 text-[14px]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Summary & Pay Button */}
              <div className="pt-6 border-t border-[#c5e3d8] flex items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-normal text-[#4a7a67] uppercase tracking-wider">Total payable</p>
                  <p className="text-[24px] font-medium text-[#1a3d30]">
                    ₹{doctor.consultation_fee}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={booking}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opening payment…
                    </>
                  ) : (
                    <>
                      Confirm and pay
                      <CreditCard className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-4 p-4 bg-white border border-[#c5e3d8] rounded-lg text-[#4a7a67]">
            <ShieldCheck className="w-5 h-5 text-[#2a7d5f] shrink-0" />
            <p className="text-[12px] font-normal leading-[1.5]">
              Payments powered by <span className="font-medium text-[#1a3d30]">Cashfree</span> — 256-bit SSL encrypted and PCI-DSS compliant.
            </p>
          </div>
        </section>

        {/* ── Right – Doctor Card ── */}
        <section className="md:col-span-2 order-1 md:order-2">
          <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[10px] sticky top-28 overflow-hidden">
            <div className="aspect-[4/5] bg-[#f0f7f4] overflow-hidden relative group">
              {doctor.user_id?.profileImage ? (
                <img
                  src={doctor.user_id.profileImage}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={doctor.user_id.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c5e3d8]">
                  <User size={80} strokeWidth={1} />
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-3 rounded-lg border border-[#c5e3d8] flex items-center gap-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[12px] font-medium text-[#1a3d30]">{doctor.rating || 'New'}</span>
                </div>
                <div className="h-4 w-px bg-[#c5e3d8]" />
                <span className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider">
                  {doctor.specialization} expert
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-[20px] font-medium text-[#1a3d30]">
                  Dr. {doctor.user_id.name}
                </h3>
                <p className="font-normal text-[#2a7d5f] text-[14px]">{doctor.qualification}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f0f7f4] border border-[#c5e3d8]/50">
                  <Briefcase className="w-4 h-4 text-[#4a7a67]" />
                  <div>
                    <p className="text-[9px] font-normal text-[#4a7a67] uppercase tracking-wider">Experience</p>
                    <p className="font-medium text-[#1a3d30] text-[13px]">{doctor.experience_years} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#c5e3d8]">
                  <CheckCircle2 className="w-4 h-4 text-[#2a7d5f]" />
                  <div>
                    <p className="text-[9px] font-normal text-[#4a7a67] uppercase tracking-wider">Fee</p>
                    <p className="font-medium text-[#1a3d30] text-[15px]">₹{doctor.consultation_fee}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Briefcase({ className, ...props }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    );
}
