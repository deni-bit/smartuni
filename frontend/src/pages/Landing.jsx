import { Link } from 'react-router-dom';
const Landing = () => (
  <div style={{ minHeight: '100vh', background: '#1e3c72', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
    <span style={{ fontSize: '64px' }}>🎓</span>
    <h1 style={{ fontFamily: 'serif', fontSize: '48px', color: '#fff', fontWeight: '800' }}>SmartUni</h1>
    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px' }}>University Management System</p>
    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
      <Link to="/login" style={{ padding: '12px 32px', background: '#ff7e5f', color: '#fff', borderRadius: '8px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>Login</Link>
      <Link to="/register" style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '15px', textDecoration: 'none' }}>Register</Link>
    </div>
  </div>
);
export default Landing;
