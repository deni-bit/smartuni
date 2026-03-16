import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register }            = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      setLoading(true);
      const user = await register(form.name, form.email, form.password, form.role);
      toast.success(`Welcome, ${user.name}!`);
      navigate(form.role === 'student' ? '/student' : '/faculty');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={{ fontSize: '40px' }}>🎓</span>
          <h1 style={s.title}>Create Account</h1>
          <p style={s.sub}>Join SmartUni today</p>
        </div>
        <div style={s.roleRow}>
          {[['student','👨‍🎓','Student'],['faculty','👨‍🏫','Faculty']].map(([val,icon,label]) => (
            <div key={val} onClick={() => setForm({...form, role: val})}
              style={{...s.roleCard, ...(form.role === val ? s.roleActive : {})}}>
              <span style={{ fontSize: '28px' }}>{icon}</span>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e3c72', marginTop: '6px' }}>{label}</p>
              {form.role === val && <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '12px', color: '#1e3c72' }}>✓</span>}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} type="text" placeholder="John Doe"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <label style={s.label}>Email Address</label>
          <input style={s.input} type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <label style={s.label}>Password</label>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input style={{...s.input, marginBottom: 0, paddingRight: '44px'}}
              type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {form.role === 'student' && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#0369a1', marginBottom: '16px' }}>
              ℹ️ Student registration requires a department. Contact admin if you need assistance.
            </div>
          )}
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Creating...' : `Create ${form.role === 'faculty' ? 'Faculty' : 'Student'} Account →`}
          </button>
        </form>
        <p style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const s = {
  page:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3c72, #2a5298)', padding: '24px' },
  card:       { background: '#fff', borderRadius: '20px', padding: '44px 40px', width: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header:     { textAlign: 'center', marginBottom: '24px' },
  title:      { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'serif', marginTop: '8px' },
  sub:        { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  roleRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  roleCard:   { border: '2px solid #e2e8f0', borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'center', position: 'relative', transition: 'all 0.2s' },
  roleActive: { border: '2px solid #1e3c72', background: '#f0f4ff' },
  label:      { display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e3c72', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:      { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e3c72', background: '#f8fafc' },
  btn:        { width: '100%', padding: '13px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  footer:     { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' },
  link:       { color: '#2a9d8f', fontWeight: '600', textDecoration: 'none' },
};

export default Register;
