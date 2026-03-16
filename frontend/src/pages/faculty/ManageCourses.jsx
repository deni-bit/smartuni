import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getMyCourses, getCourseEnrollments } from '../../services/api';

const ManageCourses = () => {
  const [courses,     setCourses]     = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingEnr,  setLoadingEnr]  = useState(false);

  useEffect(() => {
    getMyCourses()
      .then(({ data }) => { setCourses(data); if (data.length > 0) loadEnrollments(data[0]._id); })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const loadEnrollments = (courseId) => {
    setSelected(courseId);
    setLoadingEnr(true);
    getCourseEnrollments(courseId)
      .then(({ data }) => setEnrollments(data.enrollments || []))
      .catch(() => {})
      .finally(() => setLoadingEnr(false));
  };

  if (loading) return <Layout><div style={s.center}>⏳ Loading courses...</div></Layout>;

  const activeCourse = courses.find(c => c._id === selected);

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📚 My Courses</h1>
        <p style={s.sub}>{courses.length} course{courses.length !== 1 ? 's' : ''} assigned</p>
      </div>

      {courses.length === 0 ? (
        <div style={s.empty}><p style={{ fontSize: '48px' }}>📭</p><h3>No courses assigned yet</h3></div>
      ) : (
        <div style={s.layout}>

          {/* Course list */}
          <div style={s.courseList}>
            {courses.map(c => (
              <div key={c._id} onClick={() => loadEnrollments(c._id)}
                style={{ ...s.courseItem, ...(selected === c._id ? s.courseItemActive : {}) }}>
                <div style={{ ...s.courseBar, background: selected === c._id ? '#1e3c72' : '#e2e8f0' }} />
                <div style={{ flex: 1 }}>
                  <p style={s.cTitle}>{c.title}</p>
                  <p style={s.cCode}>{c.code} · {c.credits} credits</p>
                  <p style={s.cCode}>{c.enrolled}/{c.capacity} enrolled</p>
                </div>
                <span style={{ ...s.statusDot, background: c.status === 'active' ? '#16a34a' : '#94a3b8' }} />
              </div>
            ))}
          </div>

          {/* Students panel */}
          <div style={s.panel}>
            {activeCourse && (
              <>
                <div style={s.panelHeader}>
                  <div>
                    <h2 style={s.panelTitle}>{activeCourse.title}</h2>
                    <p style={s.panelSub}>
                      {activeCourse.code} · Year {activeCourse.year} · Semester {activeCourse.semester} ·
                      Room {activeCourse.schedule?.room} · {activeCourse.schedule?.days?.join(', ')} {activeCourse.schedule?.startTime}
                    </p>
                  </div>
                  <div style={s.enrollBadge}>
                    {activeCourse.enrolled} / {activeCourse.capacity}
                    <span style={{ fontSize: '10px', display: 'block', color: '#94a3b8' }}>enrolled</span>
                  </div>
                </div>

                {loadingEnr ? (
                  <p style={s.loading}>Loading students...</p>
                ) : enrollments.length === 0 ? (
                  <p style={s.noStudents}>No students enrolled yet</p>
                ) : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['#','Reg No.','Name','Email','Department','Year','Status'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enr, i) => (
                        <tr key={enr._id} style={s.tr}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.td}><span style={s.regNo}>{enr.student?.studentId}</span></td>
                          <td style={s.td}><strong>{enr.student?.user?.name}</strong></td>
                          <td style={s.td}>{enr.student?.user?.email}</td>
                          <td style={s.td}>{enr.student?.department?.code}</td>
                          <td style={s.td}>Year {enr.student?.year}</td>
                          <td style={s.td}>
                            <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#e8f5e9', color: '#2e7d32' }}>
                              {enr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

const s = {
  center:          { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:          { marginBottom: '24px' },
  pageTitle:       { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:             { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  layout:          { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' },
  courseList:      { display: 'flex', flexDirection: 'column', gap: '8px' },
  courseItem:      { background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' },
  courseItemActive:{ border: '1px solid #1e3c72', background: '#f0f4ff' },
  courseBar:       { width: '3px', height: '40px', borderRadius: '3px', flexShrink: 0 },
  cTitle:          { fontSize: '13px', fontWeight: '600', color: '#1e3c72' },
  cCode:           { fontSize: '11px', color: '#94a3b8', marginTop: '2px' },
  statusDot:       { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  panel:           { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  panelHeader:     { padding: '20px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  panelTitle:      { fontSize: '16px', fontWeight: '700', color: '#1e3c72', marginBottom: '4px' },
  panelSub:        { fontSize: '12px', color: '#64748b' },
  enrollBadge:     { textAlign: 'center', fontSize: '22px', fontWeight: '800', color: '#1e3c72' },
  loading:         { textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' },
  noStudents:      { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' },
  table:           { width: '100%', borderCollapse: 'collapse' },
  th:              { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr:              { borderBottom: '1px solid #f1f5f9' },
  td:              { padding: '12px 16px', fontSize: '13px', color: '#334155' },
  regNo:           { fontFamily: 'monospace', fontSize: '12px', background: '#f0f4ff', color: '#1e3c72', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },
  empty:           { textAlign: 'center', padding: '80px 20px', color: '#1e3c72' },
};

export default ManageCourses;