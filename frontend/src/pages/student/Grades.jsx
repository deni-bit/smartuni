import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyGrades } from '../../services/api';

// ── Tanzania grading helpers ──────────────────────────
const gradeColor = (g) => {
  if (!g || g === 'I') return '#94a3b8';
  if (g === 'A')       return '#16a34a';
  if (g === 'B+')      return '#2563eb';
  if (g === 'B')       return '#0891b2';
  if (g === 'C')       return '#d97706';
  if (g === 'D')       return '#ea580c';
  if (g === 'E')       return '#dc2626';
  return '#94a3b8';
};

const gradeLabel = (g) => ({
  'A':  'Excellent',
  'B+': 'Very Good',
  'B':  'Good',
  'C':  'Satisfactory',
  'D':  'Supplementary',
  'E':  'Fail',
  'I':  'Incomplete',
}[g] || '');

const gpaClassColor = (gpa) => {
  if (gpa >= 4.4) return '#16a34a';
  if (gpa >= 3.5) return '#2563eb';
  if (gpa >= 2.7) return '#0891b2';
  if (gpa >= 2.0) return '#d97706';
  if (gpa >= 1.0) return '#ea580c';
  return '#dc2626';
};

const getGpaClass = (gpa) => {
  if (gpa >= 4.4) return 'First Class';
  if (gpa >= 3.5) return 'Upper Second';
  if (gpa >= 2.7) return 'Lower Second';
  if (gpa >= 2.0) return 'Pass';
  if (gpa >= 1.0) return 'Supplementary';
  return 'Fail';
};

const Grades = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('all'); // 'all' | 'semester'

  useEffect(() => {
    getMyGrades()
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load grades'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={s.center}>⏳ Loading grades...</div>
    </Layout>
  );

  const {
    grades = [],
    gpa = 0,
    totalCredits = 0,
    distribution = {},
    supplementary = [],
    failed = [],
    bySemester = {},
    semesterGPAs = {},
    scale = [],
  } = data || {};

  const gpaClass   = getGpaClass(gpa);
  const approved   = grades.filter(g => g.status === 'approved');

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>📊 My Grades</h1>
          <p style={s.sub}>Academic transcript — Tanzania Grading System (5.0 scale)</p>
        </div>
        <div style={s.viewToggle}>
          <button onClick={() => setView('all')}      style={{ ...s.toggleBtn, ...(view === 'all'      ? s.toggleActive : {}) }}>All Grades</button>
          <button onClick={() => setView('semester')} style={{ ...s.toggleBtn, ...(view === 'semester' ? s.toggleActive : {}) }}>By Semester</button>
          <button onClick={() => setView('scale')}    style={{ ...s.toggleBtn, ...(view === 'scale'    ? s.toggleActive : {}) }}>Grading Scale</button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {supplementary.length > 0 && (
        <div style={{ ...s.alert, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#c2410c' }}>
              {supplementary.length} supplementary exam{supplementary.length > 1 ? 's' : ''} required
            </p>
            <p style={{ fontSize: '12px', color: '#ea580c', marginTop: '2px' }}>
              {supplementary.map(g => g.course?.code).join(', ')} — You must repeat the exam
            </p>
          </div>
        </div>
      )}
      {failed.length > 0 && (
        <div style={{ ...s.alert, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
              {failed.length} course{failed.length > 1 ? 's' : ''} failed — repeat required
            </p>
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>
              {failed.map(g => g.course?.code).join(', ')} — You must repeat the course
            </p>
          </div>
        </div>
      )}

      {/* ── GPA summary cards ── */}
      <div style={s.gpaRow}>
        <div style={s.gpaStat}>
          <p style={s.gpaLabel}>Cumulative GPA</p>
          <p style={{ ...s.gpaValue, color: gpaClassColor(gpa) }}>{gpa.toFixed(2)}</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>out of 5.0</p>
        </div>
        <div style={s.gpaStat}>
          <p style={s.gpaLabel}>GPA Class</p>
          <p style={{ ...s.gpaValue, fontSize: '18px', color: gpaClassColor(gpa) }}>{gpaClass}</p>
        </div>
        <div style={s.gpaStat}>
          <p style={s.gpaLabel}>Total Credits</p>
          <p style={{ ...s.gpaValue, color: '#1e3c72' }}>{totalCredits}</p>
        </div>
        <div style={s.gpaStat}>
          <p style={s.gpaLabel}>Courses Graded</p>
          <p style={{ ...s.gpaValue, color: '#6f42c1' }}>{approved.length}</p>
        </div>
      </div>

      {/* ── Grade distribution bar ── */}
      {approved.length > 0 && (
        <div style={s.distCard}>
          <p style={s.distTitle}>Grade Distribution</p>
          <div style={s.distRow}>
            {['A','B+','B','C','D','E'].map(grade => {
              const count = distribution[grade] || 0;
              const pct   = approved.length > 0 ? Math.round(count / approved.length * 100) : 0;
              return (
                <div key={grade} style={s.distItem}>
                  <span style={{ ...s.distGrade, color: gradeColor(grade), background: `${gradeColor(grade)}15` }}>
                    {grade}
                  </span>
                  <div style={s.distBarWrap}>
                    <div style={{ ...s.distBar, width: `${pct}%`, background: gradeColor(grade) }} />
                  </div>
                  <span style={s.distCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Grading scale reference ── */}
      {view === 'scale' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>📋 Tanzania Grading System</h3>
          <table style={s.table}>
            <thead>
              <tr>
                {['Grade','Marks Range','Grade Points','Classification','Action'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { grade: 'A',  range: '70 – 100', pts: '5.0', label: 'Excellent',     action: '—',             color: '#16a34a' },
                { grade: 'B+', range: '60 – 69',  pts: '4.0', label: 'Very Good',     action: '—',             color: '#2563eb' },
                { grade: 'B',  range: '50 – 59',  pts: '3.0', label: 'Good',          action: '—',             color: '#0891b2' },
                { grade: 'C',  range: '40 – 49',  pts: '2.0', label: 'Satisfactory',  action: '—',             color: '#d97706' },
                { grade: 'D',  range: '35 – 39',  pts: '1.0', label: 'Supplementary', action: 'Repeat Exam',   color: '#ea580c' },
                { grade: 'E',  range: '0  – 34',  pts: '0.0', label: 'Fail',          action: 'Repeat Course', color: '#dc2626' },
              ].map(row => (
                <tr key={row.grade} style={s.tr}>
                  <td style={s.td}>
                    <span style={{ padding: '4px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '16px', color: row.color, background: `${row.color}15` }}>
                      {row.grade}
                    </span>
                  </td>
                  <td style={s.td}>{row.range}</td>
                  <td style={s.td}><strong>{row.pts}</strong></td>
                  <td style={s.td}>{row.label}</td>
                  <td style={{ ...s.td, color: row.action !== '—' ? row.color : '#94a3b8', fontWeight: row.action !== '—' ? '600' : '400' }}>
                    {row.action !== '—' ? `⚠️ ${row.action}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={s.gpaScaleNote}>
            <strong>GPA Classification:</strong>{' '}
            First Class ≥ 4.4 &nbsp;|&nbsp; Upper Second ≥ 3.5 &nbsp;|&nbsp; Lower Second ≥ 2.7 &nbsp;|&nbsp; Pass ≥ 2.0 &nbsp;|&nbsp; Supplementary ≥ 1.0 &nbsp;|&nbsp; Fail &lt; 1.0
          </div>
        </div>
      )}

      {/* ── All grades table ── */}
      {view === 'all' && (
        grades.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: '48px' }}>📋</p>
            <h3>No grades yet</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Grades will appear here once submitted by faculty</p>
          </div>
        ) : (
          <div style={s.card}>
            <h3 style={s.cardTitle}>All Grades</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Sem','Course','Code','Credits','Asgn','Midterm','Final','Total','Grade','Points','Classification','Status'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grades.map(g => (
                    <tr key={g._id} style={{
                      ...s.tr,
                      background: g.letterGrade === 'E' ? '#fff5f5'
                        : g.letterGrade === 'D' ? '#fff8f0'
                        : 'transparent',
                    }}>
                      <td style={s.td}><span style={s.semBadge}>S{g.semester}</span></td>
                      <td style={{ ...s.td, maxWidth: '160px' }}>
                        <strong style={{ fontSize: '12px' }}>{g.course?.title}</strong>
                      </td>
                      <td style={s.td}><span style={s.codeTag}>{g.course?.code}</span></td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{g.course?.credits}</td>
                      <td style={s.td}>{g.assignment}/20</td>
                      <td style={s.td}>{g.midterm}/30</td>
                      <td style={s.td}>{g.finalExam}/50</td>
                      <td style={s.td}><strong>{g.totalMarks}/100</strong></td>
                      <td style={s.td}>
                        <div>
                          <span style={{ ...s.gradeBadge, color: gradeColor(g.letterGrade), background: `${gradeColor(g.letterGrade)}15` }}>
                            {g.letterGrade}
                          </span>
                          <p style={{ fontSize: '10px', color: gradeColor(g.letterGrade), marginTop: '2px' }}>
                            {gradeLabel(g.letterGrade)}
                          </p>
                        </div>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: '700', color: gradeColor(g.letterGrade) }}>
                        {g.gradePoints?.toFixed(1)}
                      </td>
                      <td style={s.td}>
                        {g.letterGrade === 'D' && <span style={s.warnTag}>⚠️ Repeat Exam</span>}
                        {g.letterGrade === 'E' && <span style={s.failTag}>❌ Repeat Course</span>}
                        {!['D','E'].includes(g.letterGrade) && g.letterGrade !== 'I' && (
                          <span style={s.passTag}>✓ Pass</span>
                        )}
                        {g.letterGrade === 'I' && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pending</span>}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                          background: g.status === 'approved' ? '#e8f5e9' : g.status === 'submitted' ? '#fff8e1' : '#f5f5f5',
                          color:      g.status === 'approved' ? '#2e7d32' : g.status === 'submitted' ? '#996600' : '#64748b',
                        }}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── By semester view ── */}
      {view === 'semester' && (
        Object.keys(bySemester).length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: '48px' }}>📋</p>
            <h3>No grades yet</h3>
          </div>
        ) : (
          Object.entries(bySemester).map(([sem, semGrades]) => {
            const semGpa = semesterGPAs[sem] || 0;
            return (
              <div key={sem} style={{ ...s.card, marginBottom: '20px' }}>
                <div style={s.semHeader}>
                  <div>
                    <h3 style={s.semTitle}>{sem}</h3>
                    <p style={s.semSub}>{semGrades.length} course{semGrades.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={s.semGpaBox}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Semester GPA</p>
                    <p style={{ fontSize: '22px', fontWeight: '800', color: gpaClassColor(semGpa) }}>
                      {semGpa.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '11px', color: gpaClassColor(semGpa) }}>{getGpaClass(semGpa)}</p>
                  </div>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Course','Code','Credits','Asgn','Midterm','Final','Total','Grade','Points','Status'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semGrades.map(g => (
                      <tr key={g._id} style={{
                        ...s.tr,
                        background: g.letterGrade === 'E' ? '#fff5f5'
                          : g.letterGrade === 'D' ? '#fff8f0'
                          : 'transparent',
                      }}>
                        <td style={{ ...s.td, maxWidth: '160px' }}>
                          <strong style={{ fontSize: '12px' }}>{g.course?.title}</strong>
                        </td>
                        <td style={s.td}><span style={s.codeTag}>{g.course?.code}</span></td>
                        <td style={{ ...s.td, textAlign: 'center' }}>{g.course?.credits}</td>
                        <td style={s.td}>{g.assignment}/20</td>
                        <td style={s.td}>{g.midterm}/30</td>
                        <td style={s.td}>{g.finalExam}/50</td>
                        <td style={s.td}><strong>{g.totalMarks}/100</strong></td>
                        <td style={s.td}>
                          <span style={{ ...s.gradeBadge, color: gradeColor(g.letterGrade), background: `${gradeColor(g.letterGrade)}15` }}>
                            {g.letterGrade}
                          </span>
                          {g.letterGrade === 'D' && <p style={{ fontSize: '10px', color: '#ea580c', marginTop: '2px' }}>⚠️ Supp.</p>}
                          {g.letterGrade === 'E' && <p style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px' }}>❌ Repeat</p>}
                        </td>
                        <td style={{ ...s.td, textAlign: 'center', fontWeight: '700', color: gradeColor(g.letterGrade) }}>
                          {g.gradePoints?.toFixed(1)}
                        </td>
                        <td style={s.td}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                            background: g.status === 'approved' ? '#e8f5e9' : '#fff8e1',
                            color:      g.status === 'approved' ? '#2e7d32' : '#996600',
                          }}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )
      )}
    </Layout>
  );
};

const s = {
  center:       { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle:    { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:          { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  viewToggle:   { display: 'flex', gap: '6px' },
  toggleBtn:    { padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#64748b', fontWeight: '500' },
  toggleActive: { background: '#1e3c72', color: '#fff', border: '1px solid #1e3c72' },
  alert:        { display: 'flex', alignItems: 'flex-start', gap: '12px', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' },
  gpaRow:       { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' },
  gpaStat:      { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' },
  gpaLabel:     { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' },
  gpaValue:     { fontSize: '26px', fontWeight: '800' },
  distCard:     { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  distTitle:    { fontSize: '13px', fontWeight: '700', color: '#1e3c72', marginBottom: '14px' },
  distRow:      { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  distItem:     { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '120px' },
  distGrade:    { padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800', flexShrink: 0 },
  distBarWrap:  { flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
  distBar:      { height: '100%', borderRadius: '6px', transition: 'width 0.6s ease', minWidth: '4px' },
  distCount:    { fontSize: '12px', fontWeight: '700', color: '#64748b', minWidth: '20px' },
  card:         { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '20px' },
  cardTitle:    { fontSize: '15px', fontWeight: '700', color: '#1e3c72', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'nowrap' },
  tr:           { borderBottom: '1px solid #f1f5f9' },
  td:           { padding: '11px 12px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },
  semBadge:     { background: '#f0f4ff', color: '#1e3c72', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  codeTag:      { fontFamily: 'monospace', fontSize: '11px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 7px', borderRadius: '5px', fontWeight: '700' },
  gradeBadge:   { padding: '4px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '800', display: 'inline-block' },
  warnTag:      { fontSize: '11px', color: '#ea580c', fontWeight: '600', background: '#fff7ed', padding: '2px 8px', borderRadius: '6px' },
  failTag:      { fontSize: '11px', color: '#dc2626', fontWeight: '600', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px' },
  passTag:      { fontSize: '11px', color: '#16a34a', fontWeight: '600', background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px' },
  semHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  semTitle:     { fontSize: '15px', fontWeight: '700', color: '#1e3c72' },
  semSub:       { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  semGpaBox:    { textAlign: 'right' },
  gpaScaleNote: { padding: '14px 20px', fontSize: '12px', color: '#64748b', background: '#f8fafc', borderTop: '1px solid #f1f5f9' },
  empty:        { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default Grades;