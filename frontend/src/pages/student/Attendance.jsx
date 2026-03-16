import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyAttendance } from '../../services/api';

const Attendance = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getMyAttendance()
      .then(({ data: d }) => {
        setData(d);
        if (d.summary?.length > 0) setSelected(d.summary[0].course?._id);
      })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={s.center}>⏳ Loading attendance...</div></Layout>;

  const { summary = [], records = [] } = data || {};
  const selectedCourse = summary.find(c => c.course?._id === selected);
  const filteredRecords = records.filter(r => r.course?._id === selected);

  const statusColor = { present: '#16a34a', absent: '#dc2626', late: '#d97706', excused: '#2563eb' };
  const statusBg    = { present: '#f0fdf4', absent: '#fef2f2', late: '#fffbeb', excused: '#eff6ff' };

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📋 My Attendance</h1>
        <p style={s.sub}>Track your attendance across all courses</p>
      </div>

      {summary.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '48px' }}>📭</p>
          <h3>No attendance records yet</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Records will appear once faculty marks attendance</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={s.summaryGrid}>
            {summary.map(item => (
              <div
                key={item.course?._id}
                onClick={() => setSelected(item.course?._id)}
                style={{ ...s.summaryCard, ...(selected === item.course?._id ? s.summaryCardActive : {}) }}
              >
                <p style={s.courseName}>{item.course?.title}</p>
                <p style={s.courseCode}>{item.course?.code}</p>
                <div style={s.pctRow}>
                  <span style={{ ...s.pct, color: item.percentage >= 75 ? '#16a34a' : item.percentage >= 50 ? '#d97706' : '#dc2626' }}>
                    {item.percentage}%
                  </span>
                  <span style={s.totalClasses}>{item.total} classes</span>
                </div>
                <div style={s.barBg}>
                  <div style={{ ...s.barFill, width: `${item.percentage}%`, background: item.percentage >= 75 ? '#16a34a' : item.percentage >= 50 ? '#d97706' : '#dc2626' }} />
                </div>
                <div style={s.statusRow}>
                  <span style={{ color: '#16a34a', fontSize: '11px' }}>✓ {item.present}</span>
                  <span style={{ color: '#dc2626', fontSize: '11px' }}>✗ {item.absent}</span>
                  <span style={{ color: '#d97706', fontSize: '11px' }}>~ {item.late}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail records */}
          {selectedCourse && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>
                {selectedCourse.course?.title} — Attendance Log
              </h3>
              {filteredRecords.length === 0 ? (
                <p style={s.noRecords}>No records for this course yet</p>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Date','Day','Status','Remarks'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(r => (
                      <tr key={r._id} style={s.tr}>
                        <td style={s.td}>{new Date(r.date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={s.td}>{new Date(r.date).toLocaleDateString('en-TZ', { weekday: 'long' })}</td>
                        <td style={s.td}>
                          <span style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', background: statusBg[r.status], color: statusColor[r.status] }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={s.td}>{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

const s = {
  center:          { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:          { marginBottom: '24px' },
  pageTitle:       { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:             { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  summaryGrid:     { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard:     { background: '#fff', borderRadius: '14px', padding: '18px', border: '2px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' },
  summaryCardActive:{ border: '2px solid #1e3c72', boxShadow: '0 4px 16px rgba(30,60,114,0.12)' },
  courseName:      { fontSize: '13px', fontWeight: '700', color: '#1e3c72', marginBottom: '2px' },
  courseCode:      { fontSize: '11px', color: '#94a3b8', marginBottom: '12px' },
  pctRow:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  pct:             { fontSize: '22px', fontWeight: '800' },
  totalClasses:    { fontSize: '11px', color: '#94a3b8' },
  barBg:           { height: '6px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' },
  barFill:         { height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' },
  statusRow:       { display: 'flex', gap: '12px' },
  card:            { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardTitle:       { fontSize: '15px', fontWeight: '700', color: '#1e3c72', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' },
  noRecords:       { textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '13px' },
  table:           { width: '100%', borderCollapse: 'collapse' },
  th:              { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr:              { borderBottom: '1px solid #f1f5f9' },
  td:              { padding: '12px 16px', fontSize: '13px', color: '#334155' },
  empty:           { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default Attendance;