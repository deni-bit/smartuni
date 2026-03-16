import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('smartuniUser');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    localStorage.setItem('smartuniUser', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password, role, extra = {}) => {
    const { data } = await registerUser({ name, email, password, role, ...extra });
    localStorage.setItem('smartuniUser', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('smartuniUser');
    setUser(null);
  };

  const isAdmin   = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';
  const isStaff   = user?.role === 'staff';

  return (
    <AuthContext.Provider value={{
      user, login, register, logout,
      isAdmin, isFaculty, isStudent, isStaff,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);