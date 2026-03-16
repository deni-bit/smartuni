import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

const ProtectedRoute = ({
  children,
  adminOnly   = false,
  facultyOnly = false,
  studentOnly = false,
  roles       = [],
}) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b', fontSize: '16px' }}>Loading...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly   && user.role !== 'admin')   return <Navigate to="/" replace />;
  if (facultyOnly && user.role !== 'faculty') return <Navigate to="/" replace />;
  if (studentOnly && user.role !== 'student') return <Navigate to="/" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
