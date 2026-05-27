import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
   FileText,
   User,
   Calendar,
   Plus,
   Download,
   Search,
   Clock,
   Activity,
   Pill,
   Loader2,
   Filter,
   ChevronRight,
   TrendingUp,
   ExternalLink,
   Save,
   Trash2,
   ArrowRight,
   AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Prescriptions() {
   const { user } = useAuth();
   const [prescriptions, setPrescriptions] = useState([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [showCreate, setShowCreate] = useState(false);
   const [selectedPrescription, setSelectedPrescription] = useState(null);

   const fetchPrescriptions = async () => {
      try {
         const res = await api.get('/prescriptions/my-prescriptions');
         setPrescriptions(res.data.prescriptions);
      } catch (err) {
         console.error('Failed to fetch prescriptions:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchPrescriptions();
   }, []);

   const filteredPrescriptions = prescriptions.filter(p =>
      p.patient_id.name.toLowerCase().includes(search.toLowerCase()) ||
      p.doctor_id.name.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase())
   );

   if (loading) return (
      <div className="flex h-full items-center justify-center">
         <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
   );

   return (
      <div className="space-y-10 animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h1 className="text-3xl font-bold font-display text-surface-950 flex items-center gap-4">
                  <div className="bg-brand-500 text-white p-2 rounded-xl shadow-lg shadow-brand-500/20">
                     <FileText className="w-6 h-6" />
                  </div>
                  Care Records & Prescriptions
               </h1>
               <p className="text-surface-500 mt-2 font-medium">Digital records of your diagnosis and prescribed medication from across all consultations.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                     type="text"
                     placeholder="Search records..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="input-field pl-10 h-11 text-sm bg-white border-surface-200"
                  />
               </div>

               {user.role === 'DOCTOR' && (
                  <button
                     className="btn-primary flex items-center gap-2 py-2.5 px-6 group shadow-lg"
                  >
                     New Record <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  </button>
               )}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12">
               {filteredPrescriptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredPrescriptions.map((p) => (
                        <div
                           key={p._id}
                           onClick={() => setSelectedPrescription(p)}
                           className={`card-premium p-6 group hover:cursor-pointer hover:shadow-xl hover:shadow-surface-200/50 transition-all border-2 relative overflow-hidden group
                        ${selectedPrescription?._id === p._id ? 'border-brand-500 bg-brand-50/20' : 'border-surface-100 bg-white hover:border-brand-200'}
                      `}
                        >
                           <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Download className="w-5 h-5 text-brand-600 hover:scale-110" />
                           </div>

                           <div className="flex items-start justify-between mb-5">
                              <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${selectedPrescription?._id === p._id ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-400'}`}>
                                 <Pill className="w-6 h-6" />
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                 </p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div>
                                 <p className="text-[10px] font-bold text-brand-600 uppercase tracking-tighter mb-1">Diagnosis</p>
                                 <h3 className="text-xl font-bold font-display text-surface-950 group-hover:text-brand-600 leading-tight">
                                    {p.diagnosis || 'General Consultation'}
                                 </h3>
                              </div>

                              <div className="pt-4 border-t border-surface-100 flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-100 border border-surface-200 shrink-0">
                                    {user.role === 'PATIENT' ? (
                                       p.doctor_id?.profileImage ? <img src={p.doctor_id.profileImage} className="w-full h-full object-cover" /> : <User size={16} className="text-surface-300 m-auto" />
                                    ) : (
                                       p.patient_id?.profileImage ? <img src={p.patient_id.profileImage} className="w-full h-full object-cover" /> : <User size={16} className="text-surface-300 m-auto" />
                                    )}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs font-bold text-surface-400 uppercase tracking-tighter uppercase">{user.role === 'PATIENT' ? 'Doctor' : 'Patient'}</p>
                                    <p className="text-sm font-bold text-surface-800 truncate">{user.role === 'PATIENT' ? `Dr. ${p.doctor_id.name}` : p.patient_id.name}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="card-premium p-20 text-center bg-white border-dashed shadow-inner">
                     <div className="w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-surface-200 opacity-50" />
                     </div>
                     <h3 className="text-2xl font-bold font-display text-surface-900 mb-2">Clean medical record</h3>
                     <p className="text-surface-500 max-w-sm mx-auto mb-10">You don't have any digital prescriptions yet. Consultations and records will appear here.</p>
                     <Link
                        to="/doctors"
                        className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-green-700 transition-all duration-200"
                     >
                        Visit Specialist
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                     </Link>
                  </div>
               )}
            </div>

            {/* Prescription detail viewer (Bottom drawer or expansion) */}
            {selectedPrescription && (
               <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-12 duration-500 border border-surface-200">
                     <header className="p-8 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-brand-600 to-emerald-500 text-white">
                        <div className="flex items-center gap-5">
                           <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                              <FileText size={32} />
                           </div>
                           <div>
                              <h2 className="text-3xl font-display font-bold leading-tight">Digital Prescription</h2>
                              <p className="font-bold text-white/80 tracking-widest text-xs uppercase flex items-center gap-1.5 px-0.5">
                                 <Clock size={12} strokeWidth={3} /> {new Date(selectedPrescription.createdAt).toLocaleString([], { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedPrescription(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
                           <X size={20} strokeWidth={3} />
                        </button>
                     </header>

                     <div className="p-8 max-h-[70vh] overflow-auto">
                        <div className="grid grid-cols-2 gap-10 mb-10 pb-8 border-b border-surface-100">
                           <div className="space-y-4">
                              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest px-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Patient Info</p>
                              <div className="flex items-center gap-4 bg-surface-50 p-4 rounded-2xl border border-surface-100">
                                 <div className="w-12 h-12 rounded-xl bg-white border border-surface-100 flex items-center justify-center font-bold text-brand-600 text-lg uppercase shadow-sm">{selectedPrescription.patient_id.name.charAt(0)}</div>
                                 <div>
                                    <h4 className="font-black text-surface-900 text-lg">{selectedPrescription.patient_id.name}</h4>
                                    <p className="text-xs font-bold text-surface-500 italic">{selectedPrescription.patient_id.email}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest px-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Prescribing Provider</p>
                              <div className="flex items-center gap-4 bg-surface-50 p-4 rounded-2xl border border-surface-100">
                                 <div className="w-12 h-12 rounded-xl bg-white border border-surface-100 flex items-center justify-center font-bold text-brand-600 text-lg uppercase shadow-sm">Dr</div>
                                 <div>
                                    <h4 className="font-black text-surface-900 text-lg">Dr. {selectedPrescription.doctor_id.name}</h4>
                                    <p className="text-xs font-bold text-surface-500 italic uppercase">Certified Specialist</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-10">
                           <div className="space-y-4">
                              <h3 className="text-xl font-bold font-display text-surface-950 flex items-center gap-2">
                                 <Activity size={20} className="text-red-500" /> Diagnosis & Findings
                              </h3>
                              <div className="p-6 bg-red-50/30 rounded-2xl border-l-[6px] border-red-500 italic text-surface-700 font-medium leading-relaxed shadow-sm">
                                 {selectedPrescription.diagnosis}
                              </div>
                           </div>

                           <div className="space-y-6">
                              <h3 className="text-xl font-bold font-display text-surface-950 flex items-center gap-2">
                                 <Pill size={20} className="text-brand-600" /> Medications
                              </h3>
                              <div className="space-y-3">
                                 {selectedPrescription.medicines?.map((med, i) => (
                                    <div key={i} className="flex gap-6 p-5 rounded-3xl bg-white border border-surface-100 shadow-sm hover:shadow-xl hover:shadow-surface-200/5 transition-all">
                                       <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0 shadow-inner">
                                          <TrendingUp size={24} />
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="font-black text-surface-950 text-xl tracking-tight">{med.name}</h4>
                                          <div className="flex items-center gap-6 mt-2 text-xs font-bold uppercase tracking-widest text-surface-500">
                                             <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-50 rounded-full border border-surface-100 text-indigo-600"><Clock size={12} strokeWidth={3} /> {med.dosage}</span>
                                             <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-50 rounded-full border border-surface-100 text-brand-600"><ExternalLink size={12} strokeWidth={3} /> {med.duration}</span>
                                          </div>
                                          {med.instructions && <p className="mt-3 text-sm font-medium text-surface-500 pt-3 border-t border-surface-50">{med.instructions}</p>}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           {selectedPrescription.notes && (
                              <div className="space-y-4">
                                 <h3 className="text-xl font-bold font-display text-surface-950 flex items-center gap-2">
                                    <Plus size={20} className="text-brand-600" /> Additional Clinical Notes
                                 </h3>
                                 <p className="p-6 bg-surface-50 rounded-2xl border border-surface-200 text-surface-600 font-medium leading-relaxed italic">
                                    {selectedPrescription.notes}
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>

                     <footer className="p-8 border-t border-surface-100 flex items-center justify-end gap-4 bg-surface-50/50">
                        <button className="btn-secondary py-3.5 px-8 font-bold flex items-center gap-2 active:scale-95 transition-transform">
                           <Download size={18} strokeWidth={2.5} /> Save PDF
                        </button>
                        <button onClick={() => setSelectedPrescription(null)} className="btn-primary py-3.5 px-10 font-bold active:scale-95 transition-transform bg-surface-900 border-surface-950 hover:bg-surface-950 shadow-none">
                           Dismiss Ready
                        </button>
                     </footer>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}

function X({ className, ...props }) {
   return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
         <path d="M18 6 6 18" /><path d="m6 6 12 12" />
      </svg>
   );
}
