import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Settings, 
  ChevronRight, 
  Bell, 
  User as UserIcon,
  Video,
  LogOut,
  Menu,
  X,
  Users,
  Search
} from 'lucide-react';
import { useState } from 'react';

// Sub pages
import Overview from './dashboard/Overview';
import MyAppointments from './dashboard/MyAppointments';
import Prescriptions from './dashboard/Prescriptions';
import BookAppointment from './dashboard/BookAppointment';
import ConsultationRoom from './dashboard/ConsultationRoom';
import FindDoctors from './FindDoctors';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = user?.role === 'DOCTOR' ? [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Patient schedule', href: '/dashboard/appointments', icon: Users },
    { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: FileText },
  ] : [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Find doctors', href: '/dashboard/doctors', icon: Search },
    { name: 'My appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: FileText },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#f0f7f4]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#1a3d30]/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-[#c5e3d8] z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-[#2a7d5f] p-2 rounded-lg">
                <Video className="text-white w-5 h-5" />
              </div>
              <span className="font-semibold text-[18px] tracking-tight text-[#1a3d30]">HealthConnect</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#4a7a67] hover:text-[#1a3d30]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-all group border-l-[3px]
                    ${active 
                      ? 'bg-[#f0f7f4] text-[#1a3d30] border-[#2a7d5f] font-semibold' 
                      : 'text-[#2e5e4a] hover:bg-[#f0f7f4] border-transparent font-medium'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-[#2a7d5f]' : 'text-[#4a7a67]'}`} />
                  <span className="text-[14px]">{item.name}</span>
                  {active && <ChevronRight className="ml-auto w-4 h-4 opacity-40" />}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-[#c5e3d8] mt-auto">
             <div className="flex items-center gap-3 px-2 mb-6">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#c5e3d8] flex items-center justify-center shrink-0">
                    <span className="text-[14px] font-semibold text-[#1a3d30]">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0 overflow-hidden">
                   <p className="text-[14px] font-medium text-[#1a3d30] truncate">{user.name}</p>
                   <p className="text-[11px] text-[#4a7a67] font-normal">{user.role.toLowerCase()}</p>
                </div>
             </div>
             <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 font-medium text-[#4a7a67] hover:text-red-500 hover:bg-[#f0f7f4] rounded-lg transition-colors text-[14px] group"
             >
                <LogOut className="w-5 h-5 group-hover:text-red-500" />
                Logout
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 shrink-0 relative z-30 bg-white/80 backdrop-blur-md border-b border-[#c5e3d8] flex items-center justify-between px-8">
           <div className="flex items-center gap-4 lg:hidden">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg border border-[#c5e3d8] text-[#4a7a67] hover:bg-[#f0f7f4]"
              >
                 <Menu className="w-5 h-5" />
              </button>
           </div>
           
           <div className="hidden sm:block">
              <h2 className="text-[20px] font-semibold text-[#1a3d30]">
                 Good morning, {user.name.split(' ')[0]}
              </h2>
              <p className="text-[13px] text-[#4a7a67] font-normal mt-0.5">
                {today} · All clear today
              </p>
           </div>

           <div className="flex items-center gap-3">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#c5e3d8] text-[#4a7a67] hover:bg-[#e2f0eb] transition-all">
                 <Bell className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#c5e3d8] text-[#4a7a67] hover:bg-[#e2f0eb] transition-all">
                 <Settings className="w-5 h-5" />
              </button>
           </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
           <Routes>
              <Route index element={<Overview />} />
              <Route path="doctors" element={<FindDoctors />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="appointments/book" element={user.role === 'PATIENT' ? <BookAppointment /> : <Navigate to="/dashboard" />} />
              <Route path="consultation/:id" element={<ConsultationRoom />} />
              <Route path="prescriptions" element={<Prescriptions />} />
           </Routes>
        </main>
      </div>
    </div>
  );
}
