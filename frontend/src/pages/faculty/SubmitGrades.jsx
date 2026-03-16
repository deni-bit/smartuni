import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyCourses, getCourseEnrollments, submitGrades, getCourseGrades } from '../../services/api';

// ── Tanzania grading system ───────────────────────────
const GRADE_SCALE = [
  { grade: 'A',  min: 70, max: 100, pts: 5.0, label: 'Excellent',     color: '#16a34a', action: null            },
  { grade: 'B+', min: 60, max: 69,  pts: 4.0, label: 'Very Good',     color: '#2563eb', action: null            },
  { grade: 'B',  min: 50, max: 59,  pts: 3.0, label: 'Good',          color: '#0891b2', action: null            },
  { grade: 'C',  min: 40, max: 49,  pts: 2.0, label: 'Satisfactory',  color: '#d97706', action: null            },
  { grade: 'D',  min: 35, max: 39,  pts: 1.0, label: 'Supplementary', color: '#ea580c', action: 'Repeat Exam'   },
  { grade: 'E',  min: 0,  max: 34,  pts: 0.0, label: 'Fail',          color: '#dc2626', action: 'Repeat Course' },
];

const getLetterGrade = (total) => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B+';
  if (total >= 50) return 'B';
  if (total >= 40) return 'C';
  if (total >= 35) return 'D';
  if (total > 0)   return 'E';
  return 'I';
};

const gradeColor = (g) => {
  const found = GRADE_SCALE.find(s => s.grade === g);
  return found?.color || '#94a3b8';
};

const SubmitGrades = () => {
  const [courses,    setCourses]    = useState([]);
  const [selected,   setSelected]   = useState('');
  const [students,   setStudents]   = useState([]);
  const [grades,     setGrades]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats,      setStats]      = useState(null);

  useEffect(() => {
    getMyCourses()
      .then(({ data }) => {
        setCourses(data);
        if (data.length > 0) { setSelected(data[0]._id); loadData(data[0]._id); }
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const loadData = async (courseId) => {
    try {
      const [enrRes, gradeRes] = await Promise.all([
        getCourseEnrollments(courseId),
        getCourseGrades(courseId, { academicYear: '2025/2026' }),
      ]);

      const enrs     = enrRes.data.enrollments  || [];
      const existing = gradeRes.data.grades     || [];
      const gradeStats = gradeRes.data.stats;

      setStudents(enrs);
      setStats(gradeStats);

      const init = {};
      enrs.forEach(e => {
        const ex = existing.find(g =>
          g.student?._id === e.student._id ||
          g.student?._id?.toString() === e.student._id?.toString()
        );
        init[e.student._id] = {
          enrollmentId: e._id,
          assignment:   ex?.assignment || 0,
          midterm:      ex?.midterm    || 0,
          finalExam:    ex?.finalExam  || 0,
        };
      });
      setGrades(init);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (studentId, field, value) => {
    const maxVal = field === 'assignment' ? 20 : field === 'midterm' ? 30 : 50;
    const num    = Math.max(0, Math.min(maxVal, Number(value)));
    setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: num } }));
  };

  const getTotal = (studentId) => {
    const g = grades[studentId];
    if (!g) return 0;
    return (g.assignment || 0) + (g.midterm || 0) + (g.finalExam || 0);
  };

  const handleSubmit = async () => {
    if (!selected || students.length === 0) {
      toast.error('No students to grade');
      return;
    }
    try {
      setSubmitting(true);
      const gradeData = students.map(e => ({
        studentId:    e.student._id,
        enrollmentId: grades[e.student._id]?.enrollmentId || e._id,
        assignment:   grades[e.student._id]?.assignment   || 0,
        midterm:      grades[e.student._id]?.midterm      || 0,
        finalExam:    grades[e.student._id]?.finalExam    || 0,
      }));
      await submitGrades({ courseId: selected, academicYear: '2025/2026', grades: gradeData });
      toast.success(`Grades submitted for ${gradeData.length} students`);
      loadData(selected);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  // Live summary stats
  const liveSummary = students.reduce((acc, enr) => {
    const total = getTotal(enr.student._id);
    const grade = getLetterGrade(total);
    acc[grade]  = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  const livePassCount = (liveSummary['A'] || 0) + (liveSummary['B+'] || 0) + (liveSummary['B'] || 0) + (liveSummary['C'] || 0);
  const liveSupplCount= liveSummary['D'] || 0;
  const liveFailCount = liveSummary['E'] || 0;

  if (loading) return <Layout><div style={s.center}>⏳ Loading...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>✏️ Submit Grades</h1>
        <p style={s.sub}>Tanzania Grading System — 5.0 scale</p>
      </div>

      {/* ── Grading scale reference ── */}
      <div style={s.scaleCard}>
        <p style={s.scaleTitle}>📋 Grading Scale Reference</p>
        <div style={s.scaleRow}>
          {GRADE_SCALE.map(g => (
            <div key={g.grade} style={{ ...s.scaleTile, border: `1px solid ${g.color}30`, background: `${g.color}08` }}>
              <p style={{ fontSize: '20px', fontWeight: '900', color: g.color }}>{g.grade}</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0' }}>{g.min}–{g.max} marks</p>
              <p style={{ fontSize: '11px', fontWeight: '700', color: g.color }}>{g.pts} pts</p>
              <p style={{ fontSize: '10px', color: '#94a3b8' }}>{g.label}</p>
              {g.action && (
                <p style={{ fontSize: '9px', color: g.color, fontWeight: '700', marginTop: '3px' }}>
                  ⚠️ {g.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Course selector ── */}
      <div style={s.controls}>
        <div>
          <label style={s.label}>Select Course</label>
          <select
            style={s.select}
            value={selected}
            onChange={e => { setSelected(e.target.value); loadData(e.target.value); }}
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title} ({c.code})</option>
            ))}
          </select>
        </div>
        <div style={s.markBadges}>
          {[['Assignment','20'],['Midterm','30'],['Final Exam','50'],['Total','100']].map(([label, max]) => (
            <div key={label} style={s.markBadge}>
              <p style={{ fontSize: '11px', color: '#64748b' }}>{label}</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e3c72' }}>/{max}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live summary ── */}
      {students.length > 0 && (
        <div style={s.liveSummary}>
          <p style={s.liveSummaryTitle}>Live Class Summary</p>
          <div style={s.liveSummaryRow}>
            {GRADE_SCALE.map(g => (
              <div key={g.grade} style={s.liveStat}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: g.color }}>{liveSummary[g.grade] || 0}</span>
                <span style={{ fontSize: '11px', color: g.color, fontWeight: '600' }}>{g.grade}</span>
              </div>
            ))}
            <div style={s.liveDivider} />
            <div style={s.liveStat}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>{livePassCount}</span>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>Pass</span>
            </div>
            <div style={s.liveStat}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#ea580c' }}>{liveSupplCount}</span>
              <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '600' }}>Suppl.</span>
            </div>
            <div style={s.liveStat}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626' }}>{liveFailCount}</span>
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>Fail</span>
            </div>
            <div style={s.liveStat}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e3c72' }}>{students.length}</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Total</span>
            </div>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '48px' }}>👥</p>
          <h3>No students enrolled in this course</h3>
        </div>
      ) : (
        <div style={s.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#','Reg No.','Student Name','Assignment (/20)','Midterm (/30)','Final Exam (/50)','Total','Grade','Points','Action Required'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((enr, i) => {
                  const sid   = enr.student._id;
                  const total = getTotal(sid);
                  const grade = getLetterGrade(total);
                  const scaleInfo = GRADE_SCALE.find(g => g.grade === grade);
                  const rowBg = grade === 'E' ? '#fff5f5' : grade === 'D' ? '#fff8f0' : 'transparent';

                  return (
                    <tr key={enr._id} style={{ ...s.tr, background: rowBg }}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={s.td}>
                        <span style={s.regNo}>{enr.student?.studentId}</span>
                      </td>
                      <td style={s.td}>
                        <strong>{enr.student?.user?.name}</strong>
                      </td>
                      {['assignment','midterm','finalExam'].map(field => (
                        <td key={field} style={s.td}>
                          <input
                            type="number"
                            min="0"
                            max={field === 'assignment' ? 20 : field === 'midterm' ? 30 : 50}
                            value={grades[sid]?.[field] || 0}
                            onChange={e => handleChange(sid, field, e.target.value)}
                            style={{
                              ...s.gradeInput,
                              borderColor: grades[sid]?.[field] > 0 ? '#1e3c72' : '#e2e8f0',
                            }}
                          />
                        </td>
                      ))}
                      <td style={s.td}>
                        <strong style={{ fontSize: '16px', color: gradeColor(grade) }}>{total}</strong>
                        <p style={{ fontSize: '10px', color: '#94a3b8' }}>/ 100</p>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          padding: '5px 14px', borderRadius: '8px',
                          fontWeight: '900', fontSize: '16px',
                          color: gradeColor(grade),
                          background: `${gradeColor(grade)}15`,
                          display: 'inline-block',
                        }}>
                          {grade}
                        </span>
                        <p style={{ fontSize: '10px', color: gradeColor(grade), marginTop: '3px' }}>
                          {scaleInfo?.label}
                        </p>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <strong style={{ color: gradeColor(grade) }}>
                          {scaleInfo?.pts.toFixed(1)}
                        </strong>
                      </td>
                      <td style={s.td}>
                        {grade === 'D' && (
                          <span style={s.warnTag}>⚠️ Repeat Exam</span>
                        )}
                        {grade === 'E' && (
                          <span style={s.failTag}>❌ Repeat Course</span>
                        )}
                        {!['D','E','I'].includes(grade) && (
                          <span style={s.passTag}>✓ Pass</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={s.submitRow}>
            <div>
              <p style={s.submitInfo}>{students.length} students · Academic Year 2025/2026</p>
              {liveSupplCount > 0 && (
                <p style={{ fontSize: '11px', color: '#ea580c', marginTop: '3px' }}>
                  ⚠️ {liveSupplCount} supplementary · {liveFailCount} fail
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : '✓ Submit All Grades'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const s = {
  center:        { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:        { marginBottom: '20px' },
  pageTitle:     { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:           { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  scaleCard:     { background: '#fff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  scaleTitle:    { fontSize: '13px', fontWeight: '700', color: '#1e3c72', marginBottom: '12px' },
  scaleRow:      { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  scaleTile:     { borderRadius: '10px', padding: '12px 16px', textAlign: 'center', minWidth: '90px', flex: 1 },
  controls:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '14px', flexWrap: 'wrap', gap: '16px' },
  label:         { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  select:        { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#1e3c72', outline: 'none', minWidth: '280px', background: '#f8fafc' },
  markBadges:    { display: 'flex', gap: '10px' },
  markBadge:     { background: '#f0f4ff', borderRadius: '8px', padding: '8px 14px', textAlign: 'center' },
  liveSummary:   { background: '#fff', borderRadius: '14px', padding: '14px 20px', border: '1px solid #e2e8f0', marginBottom: '14px' },
  liveSummaryTitle:{ fontSize: '12px', fontWeight: '700', color: '#1e3c72', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' },
  liveSummaryRow:{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  liveStat:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  liveDivider:   { width: '1px', height: '32px', background: '#e2e8f0' },
  card:          { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table:         { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th:            { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'nowrap' },
  tr:            { borderBottom: '1px solid #f1f5f9' },
  td:            { padding: '10px 12px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },
  regNo:         { fontFamily: 'monospace', fontSize: '12px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },
  gradeInput:    { width: '62px', padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', textAlign: 'center', outline: 'none', fontWeight: '700', color: '#1e3c72' },
  warnTag:       { fontSize: '11px', color: '#ea580c', fontWeight: '700', background: '#fff7ed', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' },
  failTag:       { fontSize: '11px', color: '#dc2626', fontWeight: '700', background: '#fef2f2', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' },
  passTag:       { fontSize: '11px', color: '#16a34a', fontWeight: '600', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px' },
  submitRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' },
  submitInfo:    { fontSize: '13px', color: '#64748b' },
  submitBtn:     { padding: '11px 28px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  empty:         { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default SubmitGrades;