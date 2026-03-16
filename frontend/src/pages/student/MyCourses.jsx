import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyEnrollments } from '../../services/api';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getMyEnrollments()
      .then(({ data }) => setEnrollments(data))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={s.center}>⏳ Loading courses...</div></Layout>;

  const active  = enrollments.filter(e => e.status === 'enrolled');
  const dropped = enrollments.filter(e => e.status === 'dropped');

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📚 My Courses</h1>
        <p style={s.sub}>{active.length} active enrollment{active.length !== 1 ? 's' : ''}</p>
      </div>

      {enrollments.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '48px' }}>📭</p>
          <h3>Not enrolled in any courses</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Contact admin to enroll in courses</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 style={s.sectionTitle}>Active Enrollments</h2>
              <div style={s.grid}>
                {active.map(enr => <CourseCard key={enr._id} enr={enr} />)}
              </div>
            </>
          )}
          {dropped.length > 0 && (
            <>
              <h2 style={{ ...s.sectionTitle, marginTop: '28px' }}>Dropped Courses</h2>
              <div style={s.grid}>
                {dropped.map(enr => <CourseCard key={enr._id} enr={enr} />)}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
};

const CourseCard = ({ enr }) => {
  const c = enr.course;
  const deptColors = { CS: '#1e3c72', BBA: '#2a9d8f', EE: '#ff7e5f', MATH: '#6f42c1', MED: '#dc3545' };
  const color = deptColors[c?.department?.code] || '#1e3c72';

  return (
    <div style={s.card}>
      <div style={{ ...s.cardTop, background: color }}>
        <span style={s.courseCode}>{c?.code}</span>
        <span style={s.credits}>{c?.credits} credits</span>
      </div>
      <div style={s.cardBody}>
        <h3 style={s.courseTitle}>{c?.title}</h3>
        <p style={s.dept}>{c?.department?.name}</p>
        <div style={s.infoRow}>
          <span style={s.infoItem}>👨‍🏫 {c?.faculty?.user?.name || 'TBA'}</span>
          <span style={s.infoItem}>📍 {c?.schedule?.room || 'TBA'}</span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoItem}>📅 {c?.schedule?.days?.join(', ')}</span>
          <span style={s.infoItem}>🕐 {c?.schedule?.startTime} – {c?.schedule?.endTime}</span>
        </div>
        <div style={s.cardFooter}>
          <span style={{ ...s.badge, background: enr.status === 'enrolled' ? '#e8f5e9' : '#fdecea', color: enr.status === 'enrolled' ? '#2e7d32' : '#c62828' }}>
            {enr.status}
          </span>
          <span style={s.yearSem}>Year {c?.year} · Sem {c?.semester}</span>
        </div>
      </div>
    </div>
  );
};

const s = {
  center:      { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:      { marginBottom: '24px' },
  pageTitle:   { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:         { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  sectionTitle:{ fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '14px' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' },
  card:        { background: '#fff', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(30,60,114,0.06)' },
  cardTop:     { padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  courseCode:  { fontSize: '14px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' },
  credits:     { fontSize: '11px', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '10px' },
  cardBody:    { padding: '16px 18px' },
  courseTitle: { fontSize: '14px', fontWeight: '700', color: '#1e3c72', marginBottom: '4px' },
  dept:        { fontSize: '11px', color: '#94a3b8', marginBottom: '12px' },
  infoRow:     { display: 'flex', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' },
  infoItem:    { fontSize: '11px', color: '#64748b' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
  badge:       { padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  yearSem:     { fontSize: '11px', color: '#94a3b8' },
  empty:       { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default MyCourses;