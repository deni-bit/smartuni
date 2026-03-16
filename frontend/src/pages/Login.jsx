import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import uomLogo from '../assets/uom-logo.svg';

const Login = () => {
  const [form,     setForm]     = useState({ login: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login: doLogin }      = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.login.trim()) { toast.error('Please enter your username');         return; }
    if (!form.password)     { toast.error('Please enter your password');          return; }
    try {
      setLoading(true);
      const user = await doLogin(form.login.trim(), form.password);
      toast.success(`Welcome, ${user.name}!`);
      const routes = { admin: '/admin', faculty: '/faculty', student: '/student', staff: '/admin' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <img src={uomLogo} alt="University of Mpimbwe" style={s.logo} />

        {/* Title */}
        <h1 style={s.title}>Welcome to Student Record Management System (SRMS)</h1>
        <p style={s.sub}>Please sign-in to your account and start the session</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>

          <div style={s.fieldWrap}>
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              type="text"
              placeholder="T26-03-00001 or email"
              value={form.login}
              onChange={e => setForm({ ...form, login: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <label style={s.showPassRow}>
            <input
              type="checkbox"
              checked={showPass}
              onChange={() => setShowPass(!showPass)}
              style={{ marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' }}
            />
            Show Password
          </label>

          <button
            type="submit"
            style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

        </form>

        <Link to="/register" style={s.registerLink}>
          Don't have an account? Register here
        </Link>

        <div style={s.divider} />

        <p style={s.copyright}>
          Copyright © 2026 University of Mpimbwe SRMS [Version 1.0]
        </p>

      </div>
    </div>
  );
};

const s = {
  page:        { minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card:        { background: '#fff', borderRadius: '10px', padding: '40px 36px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logo:        { width: '150px', height: 'auto', marginBottom: '16px' },
  title:       { fontSize: '18px', fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: '8px', lineHeight: '1.4' },
  sub:         { fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '28px' },
  form:        { width: '100%' },
  fieldWrap:   { marginBottom: '16px' },
  label:       { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input:       { width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  showPassRow: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151', marginBottom: '20px', cursor: 'pointer', userSelect: 'none' },
  btn:         { width: '100%', padding: '14px', background: '#1a6fcc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.3px', transition: 'opacity 0.2s' },
  registerLink:{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#1a6fcc', textDecoration: 'none', fontWeight: '500' },
  divider:     { width: '100%', height: '1px', background: '#f1f5f9', margin: '20px 0' },
  copyright:   { fontSize: '12px', color: '#94a3b8', textAlign: 'center' },
};

export default Login;
