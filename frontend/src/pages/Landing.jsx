import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 48px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid #e2e8f0' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px' }}>🎓</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: scrolled ? '#1e3c72' : '#fff', fontFamily: 'Georgia, serif' }}>
            SmartUni
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: '14px', fontWeight: '600', color: scrolled ? '#1e3c72' : 'rgba(255,255,255,0.9)', textDecoration: 'none', padding: '9px 20px', border: `1px solid ${scrolled ? '#1e3c72' : 'rgba(255,255,255,0.4)'}`, borderRadius: '8px' }}>
            Login
          </Link>
          <Link to="/register" style={{ fontSize: '14px', fontWeight: '700', background: '#ff7e5f', color: '#fff', padding: '9px 20px', borderRadius: '8px', textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f2557 0%, #1e3c72 50%, #2a5298 100%)',
        display: 'flex', alignItems: 'center',
        padding: '100px 48px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', background: 'rgba(42,157,143,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px',  width: '300px', height: '300px', background: 'rgba(255,126,95,0.08)',  borderRadius: '50%' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', position: 'relative' }}>

          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 14px', marginBottom: '24px' }}>
              <span style={{ width: '7px', height: '7px', background: '#2a9d8f', borderRadius: '50%' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>Now with Registration Number Login</span>
            </div>

            <h1 style={{ fontSize: '52px', fontWeight: '900', color: '#fff', lineHeight: '1.15', marginBottom: '24px', fontFamily: 'Georgia, serif' }}>
              Intelligently Manage Your{' '}
              <span style={{ color: '#ff7e5f' }}>University Ecosystem.</span>
            </h1>

            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.8', marginBottom: '36px', maxWidth: '480px' }}>
              SmartUni is a unified platform for administration, academics, and students. Simplify admissions, digitize grades, and enhance campus communication from one powerful dashboard.
            </p>

            <div style={{ display: 'flex', gap: '14px', marginBottom: '40px' }}>
              <Link to="/register" style={{ padding: '14px 28px', background: '#ff7e5f', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
                Get Started →
              </Link>
              <Link to="/login" style={{ padding: '14px 28px', border: '2px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', fontWeight: '600', fontSize: '15px', textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex' }}>
                {['EK','AR','JM','SM','FK'].map((init, i) => (
                  <div key={init} style={{ width: '32px', height: '32px', borderRadius: '50%', background: ['#1e3c72','#2a9d8f','#ff7e5f','#6f42c1','#c9a227'][i], border: '2px solid rgba(255,255,255,0.6)', marginLeft: i === 0 ? 0 : '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff' }}>
                    {init}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Trusted by <strong style={{ color: '#fff' }}>50+ institutions</strong> across East Africa
              </p>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Dashboard</p>
                  <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Good morning, Admin 👋</p>
                </div>
                <div style={{ background: 'rgba(255,126,95,0.2)', border: '1px solid rgba(255,126,95,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: '#ff7e5f', fontWeight: '600' }}>● Live</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[['👨‍🎓','Students','10'],['👨‍🏫','Faculty','5'],['📚','Courses','9']].map(([icon,label,val]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</p>
                    <p style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>{val}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase' }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Fee Collection</span>
                  <span style={{ color: '#2a9d8f', fontSize: '11px', fontWeight: '700' }}>85%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                  <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #2a9d8f, #42d9cc)', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>TZS 7,225,000 collected</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>of TZS 8,500,000</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Top Students</p>
                {[['T26-03-00001','Denis Mwangi','3.92'],['T26-03-00005','Marcus Juma','3.70'],['T26-03-00003','John Kimani','3.55']].map(([reg,name,gpa]) => (
                  <div key={reg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}>{name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{reg}</p>
                    </div>
                    <span style={{ color: '#2a9d8f', fontWeight: '700', fontSize: '13px' }}>{gpa}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Minimal footer ── */}
      <div style={{ background: '#0a1628', padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>© 2026 SmartUni. All rights reserved.</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Denis Steven Daudi</p>
      </div>

    </div>
  );
};

export default Landing;
