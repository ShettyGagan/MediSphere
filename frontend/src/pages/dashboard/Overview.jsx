import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Video, 
  Activity, 
  Plus,
  Loader2,
  TrendingUp,
  CreditCard,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await api.get('/appointments/upcoming');
        setAppointments(res.data.appointments);
      } catch (err) {
        console.error('Failed to fetch upcoming appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  const stats = [
    { name: 'Total appointments', value: appointments.length || 0, context: 'Active this month', trend: false },
    { name: 'Pending reviews', value: 3, context: 'From last week', trend: false },
    { name: 'Health score', value: '92%', context: '+2% from last check', trend: true },
  ];

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#2a7d5f]" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-[12px]">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] p-[14px_16px]">
            <p className="text-[12px] text-[#4a7a67] font-medium mb-1">{stat.name}</p>
            <h3 className="text-[28px] font-semibold text-[#1a3d30] leading-none">{stat.value}</h3>
            <p className={`text-[12px] mt-2 ${stat.trend ? 'text-[#2a7d5f] font-medium' : 'text-[#4a7a67] font-normal'}`}>
              {stat.context}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming appointments */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#1a3d30]">Upcoming schedule</h2>
            <Link to="/dashboard/appointments" className="text-[12px] font-medium text-[#2a7d5f] hover:underline">
              View all
            </Link>
          </div>

          <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] p-4">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.slice(0, 3).map((apt) => (
                  <div key={apt._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-[#f0f7f4] flex items-center justify-center text-[#4a7a67] overflow-hidden shrink-0 border-[0.5px] border-[#c5e3d8]">
                        {user.role === 'PATIENT' ? (
                          apt.doctor_id?.profileImage ? <img src={apt.doctor_id.profileImage} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />
                        ) : (
                          apt.patient_id?.profileImage ? <img src={apt.patient_id.profileImage} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-medium text-[#1a3d30] truncate flex items-center gap-2">
                          {user.role === 'PATIENT' ? `Dr. ${apt.doctor_id?.name}` : apt.patient_id?.name}
                          {apt.status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 text-[#2a7d5f]" />}
                        </h4>
                        <div className="flex items-center gap-3 mt-0.5 text-[12px] font-normal text-[#4a7a67]">
                           <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5" /> {new Date(apt.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           <span className="flex items-center gap-1.5 font-semibold text-[#2a7d5f] uppercase text-[10px] tracking-wider">{apt.appointment_type}</span>
                        </div>
                    </div>

                    <Link 
                      to={`/dashboard/consultation/${apt._id}`}
                      className="btn-primary"
                    >
                        Join consultation
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                 <Calendar className="w-[28px] h-[28px] text-[#c5e3d8] mx-auto" />
                 <p className="text-[#4a7a67] text-[13px] leading-[1.5] font-normal max-w-xs mx-auto">
                  {user.role === 'PATIENT' 
                    ? "You're all clear today. No sessions are currently scheduled." 
                    : "No appointments scheduled for today."}
                 </p>
                 {user.role === 'PATIENT' && (
                    <Link 
                      to="/dashboard/doctors" 
                      className="inline-block bg-[#2a7d5f] text-white text-[13px] font-medium px-[18px] py-[8px] rounded-[8px] hover:bg-[#236b50] transition-colors"
                    >
                      Book a session
                    </Link>
                 )}
              </div>
            )}
          </div>
        </section>

        {/* Side column: Quick actions / Daily insight */}
        <section className="space-y-6">
           <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-[#1a3d30]">Quick actions</h2>
              <div className="grid grid-cols-1 gap-[12px]">
                {user.role === 'PATIENT' ? (
                  <Link to="/dashboard/doctors" className="flex items-center gap-4 p-[12px_14px] bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] hover:bg-[#f0f7f4] transition-all group">
                    <Plus className="w-5 h-5 text-[#2a7d5f]" />
                    <span className="text-[14px] font-medium text-[#1a3d30]">New booking</span>
                  </Link>
                ) : (
                  <Link to="/dashboard/prescriptions" className="flex items-center gap-4 p-[12px_14px] bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] hover:bg-[#f0f7f4] transition-all group">
                    <FileText className="w-5 h-5 text-[#2a7d5f]" />
                    <span className="text-[14px] font-medium text-[#1a3d30]">New prescription</span>
                  </Link>
                )}

                <div className="flex items-center gap-4 p-[12px_14px] bg-white border-[0.5px] border-[#c5e3d8] rounded-[8px] hover:bg-[#f0f7f4] transition-all group cursor-pointer">
                    <CreditCard className="w-5 h-5 text-[#2a7d5f]" />
                    <span className="text-[14px] font-medium text-[#1a3d30]">
                      {user.role === 'PATIENT' ? 'Payment history' : 'Payment settlements'}
                    </span>
                </div>
              </div>
           </div>

           {/* Daily insight card */}
           <div className="bg-[#f0f7f4] border-[0.5px] border-[#c5e3d8] rounded-[8px] p-[14px] space-y-3">
              <p className="text-[11px] uppercase font-semibold text-[#2a7d5f] tracking-[0.06em]">Daily insight</p>
              <p className="text-[13px] text-[#1a3d30] leading-[1.6] font-normal">
                Stay hydrated and keep track of your steps today. Consistent movement is key to long-term health.
              </p>
              <div className="flex items-center gap-2 bg-white border-[0.5px] border-[#c5e3d8] rounded-[20px] px-[10px] py-[4px] w-fit">
                 <Activity className="w-3.5 h-3.5 text-[#2a7d5f]" />
                 <span className="text-[11px] text-[#2a7d5f] font-semibold uppercase tracking-tight">Goal: 10,000 steps</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
