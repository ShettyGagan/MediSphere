import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, Star, Clock, MapPin, Loader2, ArrowRight, Filter, X, Calendar, GraduationCap, Briefcase, Activity, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/doctors?specialization=${specialization}`);
      setDoctors(res.data.doctors);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchDoctors(), 300);
    return () => clearTimeout(timer);
  }, [specialization]);

  const filteredDoctors = doctors.filter(doc => 
    doc.user_id.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full bg-[#f0f7f4]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-medium text-[#1a3d30] mb-4 tracking-tight leading-[1.2]">
            Find the right <span className="text-[#2a7d5f]">expert</span> for your health
          </h1>
          <p className="text-[#4a7a67] text-[16px] font-normal leading-[1.5]">Browse through top-rated verified doctors and book your digital consultation instantly.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7a67]" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11 py-3 text-[14px]"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-3 rounded-lg border-[0.5px] border-[#c5e3d8] bg-white hover:bg-[#f0f7f4] transition-colors relative"
          >
            <Filter className={`w-4 h-4 ${specialization ? 'text-[#2a7d5f]' : 'text-[#4a7a67]'}`} />
            {specialization && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#2a7d5f]" />}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="mb-10 p-6 bg-white rounded-lg border-[0.5px] border-[#c5e3d8] animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-[#1a3d30] text-[13px]">Filter by specialization</h3>
            <button onClick={() => { setSpecialization(''); setIsFilterOpen(false); }} className="text-[#4a7a67] hover:text-[#1a3d30]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['General', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Dentist', 'Psychiatry'].map((spec) => (
              <button
                key={spec}
                onClick={() => setSpecialization(specialization === spec ? '' : spec)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-normal transition-all duration-200 border ${
                  specialization === spec 
                    ? 'bg-[#2a7d5f] text-white border-[#2a7d5f]' 
                    : 'bg-white text-[#4a7a67] hover:bg-[#f0f7f4] border-[#c5e3d8]'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-[#2a7d5f] animate-spin" />
          <p className="text-[#4a7a67] text-[14px] font-normal">Finding best doctors for you...</p>
        </div>
      ) : filteredDoctors.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map((doc) => (
            <div key={doc._id} className="bg-white border-[0.5px] border-[#c5e3d8] rounded-[12px] overflow-hidden group hover:bg-[#f0f7f4]/20 transition-colors">
              <div className="relative aspect-[16/10] bg-[#f0f7f4] overflow-hidden border-b border-[#c5e3d8]">
                 {doc.user_id.profileImage ? (
                    <img src={doc.user_id.profileImage} alt={doc.user_id.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#c5e3d8]">
                      <User size={64} strokeWidth={1} />
                    </div>
                 )}
                 <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border-[0.5px] border-[#c5e3d8] flex items-center gap-1.5 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-[12px] font-medium text-[#1a3d30]">{doc.rating || 'New'}</span>
                 </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-[#2a7d5f] uppercase tracking-wider">{doc.specialization}</p>
                  <h3 className="text-[18px] font-medium text-[#1a3d30]">Dr. {doc.user_id.name}</h3>
                  <div className="flex items-center gap-2 text-[#4a7a67] text-[13px] font-normal">
                    <GraduationCap className="w-4 h-4 text-[#c5e3d8]" />
                    <span>{doc.qualification}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-normal text-[#4a7a67] bg-[#f0f7f4] px-2.5 py-1 rounded-md border border-[#c5e3d8]/50">
                    <Briefcase className="w-3.5 h-3.5" />
                    {doc.experience_years} years exp.
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#c5e3d8] pt-5">
                   <div>
                      <p className="text-[10px] uppercase font-normal text-[#4a7a67] tracking-wider">Fee</p>
                      <p className="text-[18px] font-medium text-[#1a3d30]">₹{doc.consultation_fee}</p>
                   </div>
                   <Link 
                    to={`/dashboard/appointments/book?doctorId=${doc.user_id._id}`} 
                    className="btn-primary"
                   >
                    Book consultation
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-lg border border-dashed border-[#c5e3d8]">
           <Search className="w-12 h-12 text-[#c5e3d8] mx-auto mb-4" />
           <h3 className="text-[18px] font-medium text-[#1a3d30] mb-2">No doctors found</h3>
           <p className="text-[#4a7a67] text-[14px]">Try adjusting your search filters or browse other specializations.</p>
           <button onClick={() => { setSpecialization(''); setSearch(''); }} className="mt-6 text-[#2a7d5f] font-medium hover:underline text-[14px]">Clear all filters</button>
        </div>
      )}
    </div>
  );
}
