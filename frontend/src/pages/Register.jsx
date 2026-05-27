import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Briefcase, Plus, Loader2, ArrowRight, Star, Video } from 'lucide-react';

export default function Register() {
  const { registerPatient, registerDoctor } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT'); // 'PATIENT' or 'DOCTOR'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'PATIENT') {
        const { name, email, password } = formData;
        await registerPatient({ name, email, password });
      } else {
        await registerDoctor(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 bg-[#f0f7f4]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <div className="bg-[#2a7d5f] p-2 rounded-lg">
              <Video className="text-white w-6 h-6" />
            </div>
            <span className="font-medium text-2xl tracking-tight text-[#1a3d30]">
              HealthConnect
            </span>
          </Link>
          <h1 className="text-[32px] font-medium text-[#1a3d30] mb-3">Create your account</h1>
          <p className="text-[#4a7a67] text-[15px] max-w-md mx-auto">Join the next generation of professional healthcare.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => { setRole('PATIENT'); setError(''); }}
            className={`p-6 rounded-xl border-[0.5px] transition-all text-left relative ${
              role === 'PATIENT' 
                ? 'border-[#2a7d5f] bg-white' 
                : 'border-[#c5e3d8] bg-white/50 hover:bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
              role === 'PATIENT' ? 'bg-[#f0f7f4] text-[#2a7d5f]' : 'bg-[#e2f0eb] text-[#4a7a67]'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-[16px] text-[#1a3d30] mb-1">I'm a patient</h3>
            <p className="text-[12px] text-[#4a7a67] leading-relaxed">Need expert care via video or chat.</p>
            {role === 'PATIENT' && <div className="absolute top-4 right-4"><div className="w-2 h-2 rounded-full bg-[#2a7d5f]" /></div>}
          </button>

          <button
            onClick={() => { setRole('DOCTOR'); setError(''); }}
            className={`p-6 rounded-xl border-[0.5px] transition-all text-left relative ${
              role === 'DOCTOR' 
                ? 'border-[#2a7d5f] bg-white' 
                : 'border-[#c5e3d8] bg-white/50 hover:bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
              role === 'DOCTOR' ? 'bg-[#f0f7f4] text-[#2a7d5f]' : 'bg-[#e2f0eb] text-[#4a7a67]'
            }`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-[16px] text-[#1a3d30] mb-1">I'm a doctor</h3>
            <p className="text-[12px] text-[#4a7a67] leading-relaxed">Grow my digital medical practice.</p>
            {role === 'DOCTOR' && <div className="absolute top-4 right-4"><div className="w-2 h-2 rounded-full bg-[#2a7d5f]" /></div>}
          </button>
        </div>

        <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-xl p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-[13px] rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Full name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7a67]" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-11 text-[14px]"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7a67]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-11 text-[14px]"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7a67]" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-11 text-[14px]"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {role === 'DOCTOR' && (
              <div className="pt-6 border-t border-[#c5e3d8] mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                <h3 className="font-medium text-[#1a3d30] text-[14px] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Professional details
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="input-field text-[14px]"
                      placeholder="e.g. Cardiologist"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Qualification</label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="input-field text-[14px]"
                      placeholder="e.g. MD, PhD"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Experience (years)</label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleChange}
                      className="input-field text-[14px]"
                      placeholder="e.g. 5"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-normal text-[#4a7a67] uppercase tracking-wider pl-1">Fee (₹)</label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleChange}
                      className="input-field text-[14px]"
                      placeholder="e.g. 500"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-[16px] flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Register as {role.toLowerCase()} 
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {role === 'PATIENT' && (
            <>
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#c5e3d8]"></div>
                </div>
                <div className="relative flex justify-center text-[12px]">
                  <span className="px-4 bg-white text-[#4a7a67] font-normal italic uppercase tracking-widest">or join instantly with</span>
                </div>
              </div>

              <a
                href="http://localhost:5000/api/auth/google"
                className="btn-secondary w-full py-3.5 flex items-center justify-center gap-3 font-medium text-[14px]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </a>
            </>
          )}
        </div>

        <p className="text-center mt-10 text-[#4a7a67] text-[14px]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2a7d5f] font-medium hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
