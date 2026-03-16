import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout   from '../../components/Layout';
import StatCard  from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getMyFacultyProfile, getFacultyAttSummary } from '../../services/api';

const FacultyDashboard = () => {
  const { user }              = useAuth();
  const [data,    setData]    = useState(null);
  const [attSummary, setAtt]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyFacultyProfile(),
      getFacultyAttSummary(),
    ])
      .then(([{ data: d }, { data: a }]) => {
        setData(d);
        setAtt(a);
      })
      .catch(() => toast.error('Failed to load dashboard'))
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

  if (!data) return (
    <Layout>
      <div style={s.center}>
        <p style={{ fontSize: '40px' }}>⚠️</p>
        <p>Failed to load dashboard</p>
        <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
      </div>
    </Layout>
  );

  const { faculty, courses, totalStudents } = data;

  const stats = [
    { label: 'Faculty ID',      value: faculty.facultyId,      icon: '🎫', color: '#1e3c72' },
    { label: 'Designation',     value: faculty.designation,    icon: '🏅', color: '#2a9d8f' },
    { label: 'Department',      value: faculty.department?.name, icon: '🏛️', color: '#6f42c1' },
    { label: 'My Courses',      value: courses.length,         icon: '📚', color: '#ff7e5f' },
    { label: 'Total Students',  value: totalStudents,          icon: '👨‍🎓', color: '#1565c0' },
    { label: 'Specialization',  value: faculty.specialization || '—', icon: '🔬', color: '#c9a227' },
  ];

  return (
    <Layout>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>
            Welcome, {user?.name?.split(' ').slice(-1)[0]}! 👋
          </h1>
          <p style={s.sub}>
            {faculty.facultyId} · {faculty.department?.name} · {faculty.designation}
          </p>
        </div>
      </div>

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

        {/* My courses */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>📚 My Courses</h2>
            <Link to="/faculty/courses" style={s.viewAll}>Manage →</Link>
          </div>
          {courses.length === 0 ? (
            <p style={s.empty}>No courses assigned yet</p>
          ) : courses.map(course => (
            <div key={course._id} style={s.courseItem}>
              <div>
                <p style={s.courseTitle}>{course.title}</p>
                <p style={s.courseSub}>
                  {course.code} · {course.credits} credits · {course.enrolled}/{course.capacity} enrolled
                </p>
                <p style={s.courseSub}>
                  {course.schedule?.days?.join(', ')} · {course.schedule?.startTime} · Room {course.schedule?.room}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  ...s.badge,
                  background: course.status === 'active' ? '#e8f5e9' : '#f5f5f5',
                  color:      course.status === 'active' ? '#2e7d32' : '#666',
                }}>
                  {course.status}
                </span>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Year {course.year} · Sem {course.semester}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance summary */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>📋 Attendance Summary</h2>
            <Link to="/faculty/attendance" style={s.viewAll}>Take attendance →</Link>
          </div>
          {attSummary.length === 0 ? (
            <div style={s.emptyState}>
              <p style={{ fontSize: '32px' }}>📭</p>
              <p>No attendance records yet</p>
              <Link to="/faculty/attendance" style={{ color: 'var(--teal)', fontSize: '13px', marginTop: '8px', display: 'block' }}>
                Start taking attendance →
              </Link>
            </div>
          ) : attSummary.map(item => (
            <div key={item.course?._id} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                  {item.course?.title}
                </p>
                <span style={{
                  fontSize: '12px', fontWeight: '700',
                  color: item.avgAttendance >= 75 ? '#2e7d32' : item.avgAttendance >= 50 ? '#c9a227' : '#dc3545',
                }}>
                  {item.avgAttendance}%
                </span>
              </div>
              <div style={s.barBg}>
                <div style={{
                  ...s.barFill,
                  width:      `${item.avgAttendance}%`,
                  background: item.avgAttendance >= 75 ? '#2e7d32' : item.avgAttendance >= 50 ? '#c9a227' : '#dc3545',
                }} />
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                {item.enrolledStudents} students · {item.totalClasses} classes held
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* Quick actions */}
      <div style={s.card}>
        <h2 style={{ ...s.cardTitle, marginBottom: '16px' }}>⚡ Quick Actions</h2>
        <div style={s.actionGrid}>
          {[
            { icon: '📚', label: 'My Courses',      path: '/faculty/courses',    color: '#1e3c72' },
            { icon: '📋', label: 'Take Attendance', path: '/faculty/attendance', color: '#2a9d8f' },
            { icon: '✏️',  label: 'Submit Grades',  path: '/faculty/grades',     color: '#ff7e5f' },
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
  retryBtn:    { padding: '10px 24px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle:   { fontSize: '26px', fontWeight: '800', color: 'var(--navy)', fontFamily: 'var(--font-serif)' },
  sub:         { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card:        { background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid var(--border)', marginBottom: '20px' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle:   { fontSize: '15px', fontWeight: '700', color: 'var(--navy)' },
  viewAll:     { fontSize: '12px', color: 'var(--teal)', fontWeight: '600', textDecoration: 'none' },
  courseItem:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' },
  courseTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px' },
  courseSub:   { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  badge:       { padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  barBg:       { height: '6px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' },
  emptyState:  { textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' },
  empty:       { textAlign: 'center', color: 'var(--text-light)', padding: '20px', fontSize: '13px' },
  actionGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  actionCard:  { background: 'var(--bg)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center', textDecoration: 'none', border: '1px solid var(--border)', display: 'block' },
  actionLabel: { fontSize: '12px', fontWeight: '600', marginTop: '8px' },
};

export default FacultyDashboard;