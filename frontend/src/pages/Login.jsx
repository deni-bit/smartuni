import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form,     setForm]     = useState({ login: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await login(form.login, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const routes = { admin: '/admin', faculty: '/faculty', student: '/student', staff: '/admin' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={{ fontSize: '40px' }}>🎓</span>
          <h1 style={s.title}>SmartUni</h1>
          <p style={s.sub}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Registration No. or Email</label>
          <input
            style={s.input}
            type="text"
            placeholder="T26-03-00001 or email@example.com"
            value={form.login}
            onChange={e => setForm({ ...form, login: e.target.value })}
            required
          />

          <label style={s.label}>Password</label>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              style={{ ...s.input, marginBottom: 0, paddingRight: '44px' }}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Hint box */}
          <div style={s.hintBox}>
            <p style={s.hintTitle}>💡 Login Options</p>
            <p style={s.hintText}>Students: use your registration number (e.g. T26-03-00001)</p>
            <p style={s.hintText}>Faculty & Admin: use your email address</p>
          </div>

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={s.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={s.link}>Register</Link>
        </p>
      </div>

      {/* Side panel */}
      <div style={s.side}>
        <h2 style={s.sideTitle}>Welcome Back</h2>
        <p style={s.sideSub}>
          Access your university portal — manage courses, grades, attendance and more.
        </p>
        <div style={s.sideStats}>
          {[
            ['👨‍🎓', 'Students',    '10+'],
            ['👨‍🏫', 'Faculty',     '5+' ],
            ['📚',  'Courses',     '9+' ],
            ['🏛️',  'Departments', '5'  ],
          ].map(([icon, label, val]) => (
            <div key={label} style={s.sideStat}>
              <span style={{ fontSize: '24px' }}>{icon}</span>
              <p style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>{val}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const s = {
  page:      { minHeight: '100vh', display: 'flex' },
  card:      { width: '440px', flexShrink: 0, background: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '4px 0 20px rgba(0,0,0,0.08)' },
  header:    { textAlign: 'center', marginBottom: '32px' },
  title:     { fontSize: '28px', fontWeight: '800', color: '#1e3c72', fontFamily: 'serif', marginTop: '8px' },
  sub:       { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  label:     { display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e3c72', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:     { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e3c72', background: '#f8fafc' },
  hintBox:   { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' },
  hintTitle: { fontSize: '12px', fontWeight: '700', color: '#0369a1', marginBottom: '5px' },
  hintText:  { fontSize: '11px', color: '#0284c7', marginBottom: '2px' },
  btn:       { width: '100%', padding: '13px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },
  footer:    { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' },
  link:      { color: '#2a9d8f', fontWeight: '600', textDecoration: 'none' },
  side:      { flex: 1, background: 'linear-gradient(135deg, #1e3c72, #2a5298)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px' },
  sideTitle: { fontFamily: 'serif', fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '16px' },
  sideSub:   { fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', marginBottom: '48px', maxWidth: '320px' },
  sideStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  sideStat:  { background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', textAlign: 'center' },
};

export default Login;