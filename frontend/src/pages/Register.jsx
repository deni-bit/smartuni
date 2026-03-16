import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import uomLogo from '../assets/uom-logo.svg';

const ROLES = [
  { value: 'student', icon: '👨‍🎓', label: 'Student',  desc: 'Access courses, grades & fees' },
  { value: 'faculty', icon: '👨‍🏫', label: 'Faculty',   desc: 'Manage courses & students'    },
];

const Register = () => {
  const [form,      setForm]     = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading,   setLoading]  = useState(false);
  const [showPass,  setShowPass] = useState(false);
  const { register: doRegister } = useAuth();
  const navigate                 = useNavigate();

  const strength = form.password.length === 0 ? 0
    : form.password.length < 4  ? 1
    : form.password.length < 7  ? 2
    : form.password.length < 10 ? 3 : 4;

  const strengthColor = ['#e2e8f0','#ef4444','#f97316','#3b82f6','#22c55e'][strength];
  const strengthLabel = ['','Too short','Weak','Good','Strong'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())       { toast.error('Name is required');                        return; }
    if (form.password.length < 6){ toast.error('Password must be at least 6 characters');  return; }
    try {
      setLoading(true);
      const user = await doRegister(form.name.trim(), form.email, form.password, form.role);
      toast.success(
        `Welcome, ${user.name}!${user.registrationNo ? ` Your reg no: ${user.registrationNo}` : ''}`
      );
      navigate(user.role === 'faculty' ? '/faculty' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
        <h1 style={s.title}>Create Your Account</h1>
        <p style={s.sub}>Register to access the University of Mpimbwe portal</p>

        {/* Role selector */}
        <div style={s.roleRow}>
          {ROLES.map(r => (
            <div
              key={r.value}
              onClick={() => setForm({ ...form, role: r.value })}
              style={{ ...s.roleCard, ...(form.role === r.value ? s.roleActive : {}) }}
            >
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>{r.icon}</span>
              <p style={{ fontSize: '13px', fontWeight: '700', color: form.role === r.value ? '#1e3c72' : '#64748b' }}>
                {r.label}
              </p>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>{r.desc}</p>
              {form.role === r.value && (
                <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '12px', color: '#1e3c72', fontWeight: '800' }}>✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>

          <div style={s.fieldWrap}>
            <label style={s.label}>Full Name</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. Denis Daudi"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            {form.password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '3px', background: strength >= i ? strengthColor : '#e2e8f0', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <p style={{ fontSize: '10px', color: strengthColor, fontWeight: '600' }}>{strengthLabel}</p>
              </div>
            )}
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

          {form.role === 'student' && (
            <div style={s.infoBox}>
              🎫 After registration you will receive a unique registration number (e.g. T26-03-00001) to use for login.
            </div>
          )}

          <button
            type="submit"
            style={{ ...s.btn, opacity: loading ? 0.75 : 1 }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : `Register as ${form.role === 'faculty' ? 'Faculty' : 'Student'}`}
          </button>

        </form>

        <Link to="/login" style={s.loginLink}>
          Already have an account? Sign in here
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
  card:        { background: '#fff', borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logo:        { width: '140px', height: 'auto', marginBottom: '14px' },
  title:       { fontSize: '18px', fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: '6px' },
  sub:         { fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5' },
  roleRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: '20px' },
  roleCard:    { border: '2px solid #e2e8f0', borderRadius: '10px', padding: '14px 12px', cursor: 'pointer', textAlign: 'center', position: 'relative', transition: 'all 0.2s' },
  roleActive:  { border: '2px solid #1e3c72', background: '#f0f4ff' },
  form:        { width: '100%' },
  fieldWrap:   { marginBottom: '14px' },
  label:       { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input:       { width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  showPassRow: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151', marginBottom: '16px', cursor: 'pointer', userSelect: 'none' },
  infoBox:     { width: '100%', boxSizing: 'border-box', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#166534', marginBottom: '16px', lineHeight: '1.6' },
  btn:         { width: '100%', padding: '14px', background: '#1a6fcc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.3px', transition: 'opacity 0.2s' },
  loginLink:   { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#1a6fcc', textDecoration: 'none', fontWeight: '500' },
  divider:     { width: '100%', height: '1px', background: '#f1f5f9', margin: '20px 0' },
  copyright:   { fontSize: '12px', color: '#94a3b8', textAlign: 'center' },
};

export default Register;
