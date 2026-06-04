import { ArrowRight, Activity, Clock, ShieldCheck, Video, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="flex-1 bg-[#f0f7f4]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#c5e3d8] text-[#2a7d5f] text-[13px] font-medium mb-8">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2a7d5f]"></span>
              </span>
              Modern healthcare platform
            </div>
            <h1 className="text-[40px] md:text-[64px] font-medium text-[#1a3d30] tracking-tight leading-[1.1] mb-8">
              Expert medical care, <br className="hidden md:block" />
              <span className="text-[#2a7d5f]">accessible anywhere.</span>
            </h1>
            <p className="text-[18px] md:text-[20px] text-[#4a7a67] leading-[1.5] mb-10 max-w-2xl font-normal">
              Connect with top-rated doctors through high-quality video consultations and secure chat. Manage your complete health journey in one clean, professional workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={user ? "/doctors" : "/login"} className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-[16px]">
                Find a doctor <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="btn-secondary flex items-center justify-center gap-2 px-8 py-4 text-[16px]">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-y border-[#c5e3d8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[28px] md:text-[32px] font-medium text-[#1a3d30] mb-4">Why choose HealthConnect?</h2>
            <p className="text-[#4a7a67] max-w-2xl mx-auto text-[16px]">Designed for clarity and built for professional medical consultations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-xl p-8 space-y-6 hover:bg-[#f0f7f4] transition-colors">
              <div className="w-12 h-12 bg-[#f0f7f4] rounded-lg flex items-center justify-center text-[#2a7d5f] border border-[#c5e3d8]/50">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[18px] font-medium text-[#1a3d30] mb-3">Instant booking</h3>
                <p className="text-[#4a7a67] text-[14px] leading-[1.6]">Secure your appointment instantly with real-time availability tracking for every specialist.</p>
              </div>
            </div>

            <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-xl p-8 space-y-6 hover:bg-[#f0f7f4] transition-colors">
              <div className="w-12 h-12 bg-[#f0f7f4] rounded-lg flex items-center justify-center text-[#2a7d5f] border border-[#c5e3d8]/50">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[18px] font-medium text-[#1a3d30] mb-3">Unified consultation</h3>
                <p className="text-[#4a7a67] text-[14px] leading-[1.6]">High-definition video and real-time messaging work together in a single, secure environment.</p>
              </div>
            </div>

            <div className="bg-white border-[0.5px] border-[#c5e3d8] rounded-xl p-8 space-y-6 hover:bg-[#f0f7f4] transition-colors">
              <div className="w-12 h-12 bg-[#f0f7f4] rounded-lg flex items-center justify-center text-[#2a7d5f] border border-[#c5e3d8]/50">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[18px] font-medium text-[#1a3d30] mb-3">Secure records</h3>
                <p className="text-[#4a7a67] text-[14px] leading-[1.6]">Your health data is encrypted and prescriptions are managed with bank-grade security protocols.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-[#f0f7f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6 text-[#2a7d5f]">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-medium">Trusted by thousands of patients</span>
          </div>
          <h2 className="text-[32px] font-medium text-[#1a3d30] mb-12">Care that feels like home</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: 'Active Doctors', value: '500+' },
              { label: 'Patient Reviews', value: '10k+' },
              { label: 'Success Rate', value: '99%' },
              { label: 'Consultations', value: '25k+' }
            ].map((stat) => (
              <div key={stat.label} className="p-6 bg-white border-[0.5px] border-[#c5e3d8] rounded-lg">
                <p className="text-[24px] font-medium text-[#1a3d30]">{stat.value}</p>
                <p className="text-[12px] text-[#4a7a67] uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
