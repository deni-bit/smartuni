import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyCourses, getCourseEnrollments, submitGrades, getCourseGrades } from '../../services/api';

const SubmitGrades = () => {
  const [courses,   setCourses]   = useState([]);
  const [selected,  setSelected]  = useState('');
  const [students,  setStudents]  = useState([]);
  const [grades,    setGrades]    = useState({});
  const [existing,  setExisting]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => {
    getMyCourses()
      .then(({ data }) => { setCourses(data); if (data.length > 0) { setSelected(data[0]._id); loadData(data[0]._id); } })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const loadData = async (courseId) => {
    try {
      const [enrRes, gradeRes] = await Promise.all([
        getCourseEnrollments(courseId),
        getCourseGrades(courseId, { academicYear: '2025/2026' }),
      ]);
      const enrs   = enrRes.data.enrollments || [];
      const existing = gradeRes.data.grades || [];
      setStudents(enrs);
      setExisting(existing);
      const init = {};
      enrs.forEach(e => {
        const ex = existing.find(g => g.student?._id === e.student._id);
        init[e.student._id] = {
          enrollmentId: e._id,
          assignment:   ex?.assignment || 0,
          midterm:      ex?.midterm    || 0,
          finalExam:    ex?.finalExam  || 0,
        };
      });
      setGrades(init);
    } catch {}
  };

  const handleChange = (studentId, field, value) => {
    const num = Math.max(0, Math.min(
      field === 'assignment' ? 20 : field === 'midterm' ? 30 : 50,
      Number(value)
    ));
    setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: num } }));
  };

  const getTotal = (studentId) => {
    const g = grades[studentId];
    if (!g) return 0;
    return (g.assignment || 0) + (g.midterm || 0) + (g.finalExam || 0);
  };

  const getLetterGrade = (total) => {
    if (total >= 95) return 'A+';
    if (total >= 90) return 'A';
    if (total >= 85) return 'A-';
    if (total >= 80) return 'B+';
    if (total >= 75) return 'B';
    if (total >= 70) return 'B-';
    if (total >= 65) return 'C+';
    if (total >= 60) return 'C';
    if (total >= 55) return 'C-';
    if (total >= 50) return 'D';
    if (total > 0)   return 'F';
    return 'I';
  };

  const gradeColor = (g) => {
    if (!g || g === 'I') return '#94a3b8';
    if (['A+','A','A-'].includes(g)) return '#16a34a';
    if (['B+','B','B-'].includes(g)) return '#2563eb';
    if (['C+','C','C-'].includes(g)) return '#d97706';
    if (g === 'D') return '#ea580c';
    return '#dc2626';
  };

  const handleSubmit = async () => {
    if (!selected || students.length === 0) { toast.error('No students to grade'); return; }
    try {
      setSubmitting(true);
      const gradeData = students.map(e => ({
        studentId:    e.student._id,
        enrollmentId: grades[e.student._id]?.enrollmentId || e._id,
        assignment:   grades[e.student._id]?.assignment || 0,
        midterm:      grades[e.student._id]?.midterm    || 0,
        finalExam:    grades[e.student._id]?.finalExam  || 0,
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

  if (loading) return <Layout><div style={s.center}>⏳ Loading...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>✏️ Submit Grades</h1>
        <p style={s.sub}>Enter student grades for your courses</p>
      </div>

      {/* Course selector */}
      <div style={s.controls}>
        <div>
          <label style={s.label}>Select Course</label>
          <select style={s.select} value={selected} onChange={e => { setSelected(e.target.value); loadData(e.target.value); }}>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
          </select>
        </div>
        <div style={s.maxInfo}>
          <span style={s.maxBadge}>Assignment /20</span>
          <span style={s.maxBadge}>Midterm /30</span>
          <span style={s.maxBadge}>Final /50</span>
          <span style={{ ...s.maxBadge, background: '#1e3c72', color: '#fff' }}>Total /100</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div style={s.empty}><p style={{ fontSize: '48px' }}>👥</p><h3>No students enrolled</h3></div>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                {['#','Reg No.','Student','Assignment\n(/20)','Midterm\n(/30)','Final\n(/50)','Total','Grade'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((enr, i) => {
                const sid   = enr.student._id;
                const total = getTotal(sid);
                const grade = getLetterGrade(total);
                return (
                  <tr key={enr._id} style={s.tr}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}><span style={s.regNo}>{enr.student?.studentId}</span></td>
                    <td style={s.td}><strong>{enr.student?.user?.name}</strong></td>
                    {['assignment','midterm','finalExam'].map(field => (
                      <td key={field} style={s.td}>
                        <input
                          type="number"
                          min="0"
                          max={field === 'assignment' ? 20 : field === 'midterm' ? 30 : 50}
                          value={grades[sid]?.[field] || 0}
                          onChange={e => handleChange(sid, field, e.target.value)}
                          style={s.gradeInput}
                        />
                      </td>
                    ))}
                    <td style={s.td}><strong style={{ fontSize: '15px' }}>{total}</strong></td>
                    <td style={s.td}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: gradeColor(grade) }}>{grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={s.submitRow}>
            <p style={s.submitInfo}>{students.length} students · Academic Year 2025/2026</p>
            <button onClick={handleSubmit} style={s.submitBtn} disabled={submitting}>
              {submitting ? 'Submitting...' : '✓ Submit All Grades'}
            </button>
          </div>
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
  controls:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' },
  label:     { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  select:    { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#1e3c72', outline: 'none', minWidth: '280px', background: '#f8fafc' },
  maxInfo:   { display: 'flex', gap: '8px', alignItems: 'center' },
  maxBadge:  { fontSize: '12px', fontWeight: '600', padding: '6px 12px', background: '#f0f4ff', color: '#1e3c72', borderRadius: '8px' },
  card:      { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'pre-line' },
  tr:        { borderBottom: '1px solid #f1f5f9' },
  td:        { padding: '10px 14px', fontSize: '13px', color: '#334155' },
  regNo:     { fontFamily: 'monospace', fontSize: '12px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },
  gradeInput:{ width: '64px', padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', textAlign: 'center', outline: 'none', fontWeight: '600', color: '#1e3c72' },
  submitRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' },
  submitInfo:{ fontSize: '13px', color: '#64748b' },
  submitBtn: { padding: '10px 28px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  empty:     { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default SubmitGrades;