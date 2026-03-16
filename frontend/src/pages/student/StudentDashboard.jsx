import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout  from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getMyStudentProfile } from '../../services/api';

const StudentDashboard = () => {
  const { user }              = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    getMyStudentProfile()
      .then(({ data: d }) => setData(d))
      .catch(() => { setError(true); toast.error('Failed to load dashboard'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={s.center}>
        <p style={{ fontSize: '32px' }}>⏳</p>
        <p style={{ color: '#64748b' }}>Loading your dashboard...</p>
      </div>
    </Layout>
  );

  if (error || !data) return (
    <Layout>
      <div style={s.center}>
        <p style={{ fontSize: '40px' }}>⚠️</p>
        <p style={{ fontWeight: '700', fontSize: '16px' }}>Failed to load</p>
        <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
      </div>
    </Layout>
  );

  const { student, enrollments, notifications, feeSummary } = data;

  const stats = [
    { label: 'Reg Number',    value: student.registrationNo,              icon: '🎫', color: '#1e3c72' },
    { label: 'Year',          value: student.yearLabel,                   icon: '📅', color: '#2a9d8f' },
    { label: 'GPA',           value: `${student.gpa.toFixed(2)}`,         icon: '📊', color: student.gpa >= 3.5 ? '#2e7d32' : student.gpa >= 3.0 ? '#1565c0' : '#c9a227' },
    { label: 'GPA Class',     value: student.gpaClass,                    icon: '🏅', color: '#6f42c1' },
    { label: 'Courses',       value: enrollments.length,                  icon: '📚', color: '#ff7e5f' },
    { label: 'Fees Status',   value: feeSummary.totalBalance === 0 ? 'Cleared' : `TZS ${feeSummary.totalBalance.toLocaleString()} due`, icon: '💰', color: feeSummary.totalBalance === 0 ? '#2e7d32' : '#dc3545' },
  ];

  return (
    <Layout>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>
            Welcome, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={s.sub}>
            {student.registrationNo} · {student.department?.name} · {student.yearLabel} · Semester {student.semester}
          </p>
        </div>
      </div>

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div style={s.notifBanner}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          <p style={s.notifText}>
            You have <strong>{notifications.length}</strong> unread notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map(stat => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Two column */}
      <div style={s.twoCol}>

        {/* Enrolled courses */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>📚 My Courses</h2>
            <Link to="/student/courses" style={s.viewAll}>View all →</Link>
          </div>
          {enrollments.length === 0 ? (
            <div style={s.emptyState}>
              <p style={{ fontSize: '32px' }}>📭</p>
              <p>Not enrolled in any courses yet</p>
            </div>
          ) : enrollments.map(enr => (
            <div key={enr._id} style={s.courseItem}>
              <div>
                <p style={s.courseTitle}>{enr.course?.title}</p>
                <p style={s.courseSub}>
                  {enr.course?.code} · {enr.course?.credits} credits ·{' '}
                  {enr.course?.schedule?.days?.join(', ')} {enr.course?.schedule?.startTime}
                </p>
              </div>
              <span style={{
                ...s.statusBadge,
                background: enr.status === 'enrolled' ? '#e8f5e9' : '#fdecea',
                color:      enr.status === 'enrolled' ? '#2e7d32' : '#c62828',
              }}>
                {enr.status}
              </span>
            </div>
          ))}
        </div>

        {/* Fee summary */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>💰 Fee Summary</h2>
            <Link to="/student/fees" style={s.viewAll}>Details →</Link>
          </div>

          <div style={s.feeRow}>
            <div style={s.feeStat}>
              <p style={s.feeLabel}>Total Invoiced</p>
              <p style={s.feeValue}>TZS {feeSummary.totalFees.toLocaleString()}</p>
            </div>
            <div style={s.feeStat}>
              <p style={s.feeLabel}>Total Paid</p>
              <p style={{ ...s.feeValue, color: '#2e7d32' }}>
                TZS {feeSummary.totalPaid.toLocaleString()}
              </p>
            </div>
            <div style={s.feeStat}>
              <p style={s.feeLabel}>Balance Due</p>
              <p style={{ ...s.feeValue, color: feeSummary.totalBalance > 0 ? '#dc3545' : '#2e7d32' }}>
                TZS {feeSummary.totalBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment progress bar */}
          {feeSummary.totalFees > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Payment progress</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e3c72' }}>
                  {Math.round(feeSummary.totalPaid / feeSummary.totalFees * 100)}%
                </span>
              </div>
              <div style={s.barBg}>
                <div style={{
                  ...s.barFill,
                  width:      `${Math.round(feeSummary.totalPaid / feeSummary.totalFees * 100)}%`,
                  background: feeSummary.totalBalance === 0 ? '#2e7d32' : '#1e3c72',
                }} />
              </div>
            </div>
          )}

          {feeSummary.totalBalance === 0 && (
            <div style={s.paidBanner}>
              ✅ All fees paid — you're clear!
            </div>
          )}
        </div>

      </div>

      {/* Quick actions */}
      <div style={s.card}>
        <h2 style={{ ...s.cardTitle, marginBottom: '16px' }}>⚡ Quick Access</h2>
        <div style={s.actionGrid}>
          {[
            { icon: '📚', label: 'My Courses',  path: '/student/courses',    color: '#1e3c72' },
            { icon: '📋', label: 'Attendance',  path: '/student/attendance', color: '#2a9d8f' },
            { icon: '📊', label: 'My Grades',   path: '/student/grades',     color: '#ff7e5f' },
            { icon: '💰', label: 'My Fees',      path: '/student/fees',       color: '#c9a227' },
          ].map(action => (
            <Link key={action.path} to={action.path} style={s.actionCard}>
              <span style={{ fontSize: '28px' }}>{action.icon}</span>
              <p style={{ ...s.actionLabel, color: action.color }}>{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

    </Layout>
  );
};

const s = {
  center:      { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  retryBtn:    { marginTop: '8px', padding: '10px 24px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle:   { fontSize: '26px', fontWeight: '800', color: 'var(--navy)', fontFamily: 'var(--font-serif)' },
  sub:         { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
  notifBanner: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  notifText:   { fontSize: '13px', color: '#92400e' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card:        { background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid var(--border)', marginBottom: '20px' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle:   { fontSize: '15px', fontWeight: '700', color: 'var(--navy)' },
  viewAll:     { fontSize: '12px', color: 'var(--teal)', fontWeight: '600', textDecoration: 'none' },
  courseItem:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  courseTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text)' },
  courseSub:   { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  statusBadge: { padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', flexShrink: 0 },
  feeRow:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  feeStat:     { background: 'var(--bg)', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  feeLabel:    { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  feeValue:    { fontSize: '15px', fontWeight: '700', color: 'var(--navy)' },
  barBg:       { height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' },
  paidBanner:  { marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#166534', fontWeight: '500' },
  emptyState:  { textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' },
  actionGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  actionCard:  { background: 'var(--bg)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center', textDecoration: 'none', border: '1px solid var(--border)', display: 'block' },
  actionLabel: { fontSize: '12px', fontWeight: '600', marginTop: '8px' },
};

export default StudentDashboard;