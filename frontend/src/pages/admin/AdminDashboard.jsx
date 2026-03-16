import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout   from '../../components/Layout';
import StatCard  from '../../components/StatCard';
import {
  getReportSummary,
  getTopStudents,
  getEnrollByDept,
} from '../../services/api';

const AdminDashboard = () => {
  const [summary,  setSummary]  = useState(null);
  const [topStudents, setTopStudents] = useState([]);
  const [deptStats,   setDeptStats]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      getReportSummary(),
      getTopStudents({ limit: 5 }),
      getEnrollByDept(),
    ])
      .then(([{ data: s }, { data: t }, { data: d }]) => {
        setSummary(s);
        setTopStudents(t);
        setDeptStats(d);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={s.center}>
        <p style={{ fontSize: '32px' }}>⏳</p>
        <p style={{ color: '#64748b' }}>Loading dashboard...</p>
      </div>
    </Layout>
  );

  const stats = [
    { label: 'Total Students',   value: summary.totalStudents,             icon: '👨‍🎓', color: '#1e3c72' },
    { label: 'Total Faculty',    value: summary.totalFaculty,              icon: '👨‍🏫', color: '#2a9d8f' },
    { label: 'Active Courses',   value: summary.totalCourses,              icon: '📚', color: '#ff7e5f' },
    { label: 'Departments',      value: summary.totalDepartments,          icon: '🏛️', color: '#6f42c1' },
    { label: 'Enrollments',      value: summary.totalEnrollments,          icon: '📋', color: '#1565c0' },
    { label: 'Avg GPA',          value: summary.avgGpa,                    icon: '📊', color: '#2e7d32' },
    { label: 'Attendance Rate',  value: `${summary.attendanceRate}%`,      icon: '✅', color: '#00838f' },
    { label: 'Fee Collection',   value: `${summary.collectionRate}%`,      icon: '💰', color: '#c9a227' },
    { label: 'Total Invoiced',   value: summary.totalInvoicedFormatted,    icon: '🧾', color: '#1e3c72' },
    { label: 'Total Collected',  value: summary.totalCollectedFormatted,   icon: '💵', color: '#2e7d32' },
    { label: 'Balance Due',      value: summary.totalBalanceFormatted,     icon: '⚠️', color: summary.totalBalance > 0 ? '#dc3545' : '#aaa' },
    { label: 'Overdue Fees',     value: summary.overdueFees,               icon: '🔴', color: summary.overdueFees > 0 ? '#dc3545' : '#aaa' },
  ];

  return (
    <Layout>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Admin Dashboard</h1>
          <p style={s.sub}>Full platform overview — SmartUni Management System</p>
        </div>
        <div style={s.headerBtns}>
          <Link to="/admin/users"   style={s.btn}>👥 Manage Users</Link>
          <Link to="/admin/reports" style={s.btnOutline}>📊 Reports</Link>
        </div>
      </div>

      {/* Stats grid */}
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

        {/* Top students */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>🏆 Top Students by GPA</h2>
            <Link to="/admin/reports" style={s.viewAll}>Full report →</Link>
          </div>
          {topStudents.length === 0 ? (
            <p style={s.empty}>No student data yet</p>
          ) : topStudents.map((student, i) => (
            <div key={student._id} style={s.listItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  ...s.rank,
                  background: i === 0 ? '#c9a227' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#f1f5f9',
                  color:      i < 3 ? '#fff' : '#64748b',
                }}>
                  {i + 1}
                </span>
                <div>
                  <p style={s.listName}>{student.user?.name}</p>
                  <p style={s.listSub}>
                    {student.department?.name} · {student.yearLabel}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '800', color: '#1e3c72', fontSize: '16px' }}>
                  {student.gpa.toFixed(2)}
                </p>
                <p style={{ fontSize: '10px', color: '#94a3b8' }}>{student.gpaClass}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Enrollment by department */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>🏛️ Students by Department</h2>
            <Link to="/admin/departments" style={s.viewAll}>Manage →</Link>
          </div>
          {deptStats.length === 0 ? (
            <p style={s.empty}>No department data yet</p>
          ) : deptStats.map(dept => {
            const pct = summary.totalStudents > 0
              ? Math.round(dept.count / summary.totalStudents * 100)
              : 0;
            return (
              <div key={dept._id} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div>
                    <span style={s.deptCode}>{dept.code}</span>
                    <span style={s.deptName}>{dept.name}</span>
                  </div>
                  <span style={s.deptCount}>
                    {dept.count} students · GPA {dept.avgGpa}
                  </span>
                </div>
                <div style={s.barBg}>
                  <div style={{
                    ...s.barFill,
                    width:      `${pct}%`,
                    background: '#1e3c72',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Quick actions */}
      <div style={s.card}>
        <h2 style={{ ...s.cardTitle, marginBottom: '16px' }}>⚡ Quick Actions</h2>
        <div style={s.actionGrid}>
          {[
            { icon: '👥', label: 'Manage Users',        path: '/admin/users',       color: '#1e3c72' },
            { icon: '🏛️', label: 'Departments',         path: '/admin/departments', color: '#6f42c1' },
            { icon: '📚', label: 'Manage Courses',       path: '/admin/courses',     color: '#ff7e5f' },
            { icon: '💰', label: 'Fee Management',       path: '/admin/fees',        color: '#2a9d8f' },
            { icon: '📊', label: 'Reports & Analytics',  path: '/admin/reports',     color: '#c9a227' },
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
  center:     { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle:  { fontSize: '26px', fontWeight: '800', color: 'var(--navy)', fontFamily: 'var(--font-serif)' },
  sub:        { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
  headerBtns: { display: 'flex', gap: '10px' },
  btn:        { padding: '9px 18px', background: 'var(--navy)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px' },
  btnOutline: { padding: '9px 18px', border: '1px solid var(--border)', background: '#fff', color: 'var(--text)', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' },

  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' },

  twoCol:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card:       { background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid var(--border)', marginBottom: '20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle:  { fontSize: '15px', fontWeight: '700', color: 'var(--navy)' },
  viewAll:    { fontSize: '12px', color: 'var(--teal)', fontWeight: '600', textDecoration: 'none' },

  listItem:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  listName:   { fontSize: '13px', fontWeight: '600', color: 'var(--text)' },
  listSub:    { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  rank:       { width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },

  deptCode:   { background: '#f0f4ff', color: '#1e3c72', padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', marginRight: '8px' },
  deptName:   { fontSize: '12px', color: 'var(--text)', fontWeight: '500' },
  deptCount:  { fontSize: '11px', color: 'var(--text-muted)' },
  barBg:      { height: '6px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' },

  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' },
  actionCard: { background: 'var(--bg)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center', textDecoration: 'none', border: '1px solid var(--border)', display: 'block' },
  actionLabel:{ fontSize: '12px', fontWeight: '600', marginTop: '8px' },

  empty:      { textAlign: 'center', color: 'var(--text-light)', padding: '20px', fontSize: '13px' },
};

export default AdminDashboard;