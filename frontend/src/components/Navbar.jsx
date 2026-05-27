import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Menu, X, Video } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-[60] bg-white border-b border-[#c5e3d8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-[#2a7d5f] p-2 rounded-lg">
              <Video className="text-white w-5 h-5" />
            </div>
            <span className="font-medium text-lg tracking-tight text-[#1a3d30]">
              HealthConnect
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {(!user || user.role === 'PATIENT') && (
              <Link to="/doctors" className="text-[14px] font-medium text-[#2e5e4a] hover:text-[#1a3d30] transition-colors">
                Find doctors
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-6">
                <Link to="/dashboard" className="text-[14px] font-medium text-[#2e5e4a] hover:text-[#1a3d30] transition-colors">
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-[#c5e3d8]" />
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-medium text-[#1a3d30] leading-none">{user.name}</span>
                    <span className="text-[11px] text-[#4a7a67] mt-1">{user.role.toLowerCase()}</span>
                  </div>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-9 h-9 rounded-lg object-cover border border-[#c5e3d8]" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#c5e3d8] flex items-center justify-center text-[#1a3d30] font-medium text-[13px]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button onClick={handleLogout} className="text-[13px] font-medium text-[#4a7a67] hover:text-red-500 hover:bg-[#f0f7f4] px-3 py-1.5 rounded-lg transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-[14px] font-medium text-[#2e5e4a] hover:text-[#1a3d30] transition-colors px-4 py-2">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#4a7a67] hover:text-[#1a3d30]">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[#c5e3d8] bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 flex flex-col gap-4">
            {(!user || user.role === 'PATIENT') && (
              <Link to="/doctors" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-[#2e5e4a]">Find doctors</Link>
            )}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-[#2e5e4a]">Dashboard</Link>
                <button onClick={() => { setIsOpen(false); handleLogout(); }} className="text-left text-[14px] font-medium text-red-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-[#2e5e4a]">Sign in</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-[#2a7d5f]">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
