import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Loader2,
  Trash2,
  History,
  ArrowRight,
  Filter,
  User,
  ExternalLink
} from 'lucide-react';

export default function MyAppointments() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const success = searchParams.get('success');

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/appointments/my-appointments${statusFilter ? `?status=${statusFilter}` : ''}`);
      setAppointments(res.data.appointments);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err) {
      alert('Failed to cancel appointment');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-[#f0f7f4] text-[#2a7d5f] border-[#c5e3d8]';
      case 'PENDING': return 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]';
      case 'COMPLETED': return 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]';
      case 'CANCELLED': return 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]';
      default: return 'bg-[#f0f7f4] text-[#4a7a67] border-[#c5e3d8]';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {success && (
        <div className="bg-[#2a7d5f] text-white p-4 rounded-[8px] flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-[13px] font-medium">Payment successful. Your appointment has been confirmed.</p>
           </div>
           <button 
              onClick={() => window.history.replaceState({}, '', '/dashboard/appointments')}
              className="text-[12px] font-medium underline underline-offset-4 opacity-80 hover:opacity-100"
           >
              Dismiss
           </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-[18px] font-medium text-[#1a3d30]">Appointment records</h1>
           <p className="text-[13px] text-[#4a7a67] font-normal">View your consultation history and upcoming sessions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a7a67]" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field pl-9 py-2 text-[13px] font-normal bg-white appearance-none cursor-pointer"
                >
                  <option value="">All appointments</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Finished</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4a7a67]">
                    <ChevronDown className="w-3.5 h-3.5" />
                </div>
            </div>
            
            {user.role === 'PATIENT' && (
              <Link to="/doctors" className="btn-primary">
                New booking
              </Link>
            )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-[#2a7d5f] animate-spin" />
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((apt) => (
            <div key={apt._id} className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] p-[16px] hover:bg-[#f0f7f4]/30 transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Profile Pic */}
                <div className="w-14 h-14 rounded-lg bg-[#f0f7f4] border border-[#c5e3d8] flex items-center justify-center shrink-0 overflow-hidden">
                   {user.role === 'PATIENT' ? (
                      apt.doctor_id?.profileImage ? <img src={apt.doctor_id.profileImage} className="w-full h-full object-cover" /> : <User size={24} className="text-[#4a7a67]" />
                   ) : (
                      apt.patient_id?.profileImage ? <img src={apt.patient_id.profileImage} className="w-full h-full object-cover" /> : <User size={24} className="text-[#4a7a67]" />
                   )}
                </div>

                <div className="flex-1 space-y-2">
                   <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[16px] font-medium text-[#1a3d30]">
                        {user.role === 'PATIENT' ? `Dr. ${apt.doctor_id?.name}` : apt.patient_id?.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight uppercase border ${getStatusStyle(apt.status)}`}>
                        {apt.status.toLowerCase()}
                      </span>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[#4a7a67] font-normal text-[13px]">
                      <div className="flex items-center gap-1.5">
                         <Calendar className="w-3.5 h-3.5 text-[#2a7d5f]" />
                         {new Date(apt.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Clock className="w-3.5 h-3.5 text-[#2a7d5f]" />
                         {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-[#2a7d5f] uppercase text-[10px] tracking-wider">
                          <Video className="w-3.5 h-3.5" />
                          Consultation
                       </div>
                   </div>
                </div>

                <div className="w-full md:w-auto flex flex-wrap items-center gap-3 pt-4 md:pt-0 border-t md:border-0 border-[#c5e3d8]">
                   {apt.status === 'CONFIRMED' && (
                     <Link
                      to={`/dashboard/consultation/${apt._id}`}
                      className="btn-primary"
                     >
                       Join consultation
                     </Link>
                   )}

                   {apt.status === 'COMPLETED' && (
                     <span className="text-[13px] font-medium text-[#4a7a67] flex items-center gap-1.5">
                       <CheckCircle2 className="w-4 h-4 text-[#2a7d5f]" /> Consultation ended
                     </span>
                   )}

                   {apt.status === 'CONFIRMED' && (
                     <button 
                      onClick={() => handleCancel(apt._id)}
                      className="p-2 text-[#b91c1c] hover:bg-[#fef2f2] rounded-lg transition-all"
                      title="Cancel session"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                   )}

                   {apt.status === 'COMPLETED' && (
                       <Link 
                         to="/dashboard/prescriptions"
                         className="btn-secondary"
                       >
                          Prescription <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                       </Link>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] p-20 text-center border-dashed">
           <Calendar className="w-12 h-12 text-[#c5e3d8] mx-auto mb-4" />
           <h3 className="text-[18px] font-medium text-[#1a3d30] mb-2">No appointment history found</h3>
           <p className="text-[#4a7a67] max-w-sm mx-auto text-[13px] mb-8">Start your healthcare journey by booking your first session with top-rated medical experts.</p>
           {user.role === 'PATIENT' && (
             <Link to="/doctors" className="btn-primary">
                Browse specialists
             </Link>
           )}
        </div>
      )}
    </div>
  );
}

function ChevronDown({ className, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
