import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('smartuniUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('smartuniUser');
      }
    }
    setLoading(false);
  }, []);

  // ── login accepts reg number OR email ─────────────
  const login = async (loginId, password) => {
    const { data } = await loginUser({ login: loginId, password });
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

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      isAdmin:   user?.role === 'admin',
      isFaculty: user?.role === 'faculty',
      isStudent: user?.role === 'student',
      isStaff:   user?.role === 'staff',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
