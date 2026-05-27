import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setDoctorProfile(res.data.doctorProfile || null);
    } catch (err) {
      setUser(null);
      setDoctorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await checkAuth();
    return res.data;
  };

  const registerPatient = async (data) => {
    const res = await api.post('/auth/register/patient', data);
    await checkAuth();
    return res.data;
  };

  const registerDoctor = async (data) => {
    const res = await api.post('/auth/register/doctor', data);
    await checkAuth();
    return res.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setDoctorProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctorProfile,
        loading,
        login,
        registerPatient,
        registerDoctor,
        logout,
        checkAuth,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
