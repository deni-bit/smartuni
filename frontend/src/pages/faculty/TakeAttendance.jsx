import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyCourses, getCourseEnrollments, markAttendance } from '../../services/api';

const TakeAttendance = () => {
  const [courses,     setCourses]     = useState([]);
  const [selected,    setSelected]    = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [students,    setStudents]    = useState([]);
  const [attendance,  setAttendance]  = useState({});
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    getMyCourses()
      .then(({ data }) => { setCourses(data); if (data.length > 0) { setSelected(data[0]._id); loadStudents(data[0]._id); } })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const loadStudents = (courseId) => {
    getCourseEnrollments(courseId)
      .then(({ data }) => {
        const enrs = data.enrollments || [];
        setStudents(enrs);
        const init = {};
        enrs.forEach(e => { init[e.student._id] = 'present'; });
        setAttendance(init);
      })
      .catch(() => {});
  };

  const handleCourseChange = (courseId) => {
    setSelected(courseId);
    loadStudents(courseId);
  };

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(e => { updated[e.student._id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!selected) { toast.error('Please select a course'); return; }
    if (students.length === 0) { toast.error('No students to mark'); return; }
    try {
      setSubmitting(true);
      const records = students.map(e => ({
        studentId: e.student._id,
        status:    attendance[e.student._id] || 'absent',
      }));
      await markAttendance({ courseId: selected, date, records });
      toast.success(`Attendance marked for ${records.length} students`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors = {
    present: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    absent:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    late:    { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    excused: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  };

  const summary = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent:  Object.values(attendance).filter(s => s === 'absent').length,
    late:    Object.values(attendance).filter(s => s === 'late').length,
    excused: Object.values(attendance).filter(s => s === 'excused').length,
  };

  if (loading) return <Layout><div style={s.center}>⏳ Loading...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📋 Take Attendance</h1>
        <p style={s.sub}>Mark student attendance for your courses</p>
      </div>

      {/* Controls */}
      <div style={s.controls}>
        <div style={s.controlItem}>
          <label style={s.label}>Select Course</label>
          <select style={s.select} value={selected} onChange={e => handleCourseChange(e.target.value)}>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
          </select>
        </div>
        <div style={s.controlItem}>
          <label style={s.label}>Date</label>
          <input style={s.dateInput} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={s.markAllBtns}>
          <label style={s.label}>Mark All As</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['present','absent','late','excused'].map(status => (
              <button key={status} onClick={() => markAll(status)} style={{ ...s.markAllBtn, background: statusColors[status].bg, color: statusColors[status].color, border: `1px solid ${statusColors[status].border}` }}>
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {students.length > 0 && (
        <div style={s.summaryBar}>
          {Object.entries(summary).map(([status, count]) => (
            <div key={status} style={{ ...s.summaryItem, background: statusColors[status].bg, color: statusColors[status].color }}>
              <span style={{ fontWeight: '800', fontSize: '18px' }}>{count}</span>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Student list */}
      {students.length === 0 ? (
        <div style={s.empty}><p style={{ fontSize: '48px' }}>👥</p><h3>No students enrolled in this course</h3></div>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                {['#','Reg No.','Name','Present','Absent','Late','Excused'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((enr, i) => (
                <tr key={enr._id} style={{ ...s.tr, background: statusColors[attendance[enr.student._id] || 'present'].bg + '60' }}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={s.td}><span style={s.regNo}>{enr.student?.studentId}</span></td>
                  <td style={s.td}><strong>{enr.student?.user?.name}</strong></td>
                  {['present','absent','late','excused'].map(status => (
                    <td key={status} style={{ ...s.td, textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`att-${enr.student._id}`}
                        checked={attendance[enr.student._id] === status}
                        onChange={() => setStatus(enr.student._id, status)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: statusColors[status].color }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={s.submitRow}>
            <p style={s.submitInfo}>{students.length} students · {date}</p>
            <button onClick={handleSubmit} style={s.submitBtn} disabled={submitting}>
              {submitting ? 'Saving...' : '✓ Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const s = {
  center:      { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:      { marginBottom: '24px' },
  pageTitle:   { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:         { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  controls:    { display: 'flex', gap: '20px', alignItems: 'flex-end', background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '16px', flexWrap: 'wrap' },
  controlItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:       { fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  select:      { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#1e3c72', outline: 'none', minWidth: '240px', background: '#f8fafc' },
  dateInput:   { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#1e3c72', outline: 'none', background: '#f8fafc' },
  markAllBtns: { display: 'flex', flexDirection: 'column', gap: '6px' },
  markAllBtn:  { padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize' },
  summaryBar:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' },
  summaryItem: { borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  card:        { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 16px', fontSize: '13px', color: '#334155' },
  regNo:       { fontFamily: 'monospace', fontSize: '12px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },
  submitRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' },
  submitInfo:  { fontSize: '13px', color: '#64748b' },
  submitBtn:   { padding: '10px 24px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  empty:       { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default TakeAttendance;