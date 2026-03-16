import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyGrades } from '../../services/api';

const gradeColor = (g) => {
  if (!g || g === 'I') return '#94a3b8';
  if (['A+','A','A-'].includes(g)) return '#16a34a';
  if (['B+','B','B-'].includes(g)) return '#2563eb';
  if (['C+','C','C-'].includes(g)) return '#d97706';
  if (g === 'D') return '#ea580c';
  return '#dc2626';
};

const Grades = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyGrades()
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load grades'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={s.center}>⏳ Loading grades...</div></Layout>;

  const { grades = [], gpa = 0, totalCredits = 0 } = data || {};

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📊 My Grades</h1>
        <p style={s.sub}>Academic performance record</p>
      </div>

      {/* GPA summary */}
      <div style={s.gpaRow}>
        {[
          { label: 'Cumulative GPA',  value: gpa.toFixed(2),   color: gpa >= 3.5 ? '#16a34a' : gpa >= 3.0 ? '#2563eb' : '#d97706' },
          { label: 'Total Credits',   value: totalCredits,      color: '#1e3c72' },
          { label: 'Courses Graded',  value: grades.filter(g => g.status === 'approved').length, color: '#6f42c1' },
          { label: 'GPA Class',       value: gpa >= 3.7 ? 'First Class' : gpa >= 3.3 ? 'Upper Second' : gpa >= 3.0 ? 'Lower Second' : gpa >= 2.0 ? 'Pass' : '—', color: '#2a9d8f' },
        ].map(stat => (
          <div key={stat.label} style={s.gpaStat}>
            <p style={s.gpaLabel}>{stat.label}</p>
            <p style={{ ...s.gpaValue, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {grades.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '48px' }}>📋</p>
          <h3>No grades yet</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Grades will appear here once submitted by faculty</p>
        </div>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Course','Code','Credits','Assignment','Midterm','Final','Total','Grade','Points','Status'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g._id} style={s.tr}>
                  <td style={s.td}><strong>{g.course?.title}</strong></td>
                  <td style={s.td}>{g.course?.code}</td>
                  <td style={s.td}>{g.course?.credits}</td>
                  <td style={s.td}>{g.assignment}/20</td>
                  <td style={s.td}>{g.midterm}/30</td>
                  <td style={s.td}>{g.finalExam}/50</td>
                  <td style={s.td}><strong>{g.totalMarks}/100</strong></td>
                  <td style={s.td}>
                    <span style={{ ...s.gradeBadge, color: gradeColor(g.letterGrade), background: `${gradeColor(g.letterGrade)}15` }}>
                      {g.letterGrade}
                    </span>
                  </td>
                  <td style={s.td}>{g.gradePoints.toFixed(1)}</td>
                  <td style={s.td}>
                    <span style={{ ...s.statusBadge, background: g.status === 'approved' ? '#e8f5e9' : '#fff8e1', color: g.status === 'approved' ? '#2e7d32' : '#996600' }}>
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

const s = {
  center:    { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:    { marginBottom: '24px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:       { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  gpaRow:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' },
  gpaStat:   { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' },
  gpaLabel:  { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  gpaValue:  { fontSize: '26px', fontWeight: '800' },
  card:      { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr:        { borderBottom: '1px solid #f1f5f9' },
  td:        { padding: '12px 14px', fontSize: '13px', color: '#334155' },
  gradeBadge:{ padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '800' },
  statusBadge:{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  empty:     { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default Grades;