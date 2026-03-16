import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getCourses, getAdminDepartments, getAllFaculty, createCourse, deleteCourse } from '../../services/api';

const ManageCourses = () => {
  const [courses,  setCourses]  = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState('');
  const [form, setForm] = useState({
    title: '', code: '', department: '', faculty: '', credits: 3,
    semester: 1, year: 1, capacity: 50, academicYear: '2025/2026',
    schedDays: '', startTime: '', endTime: '', room: '',
  });

  const load = () => {
    Promise.all([getCourses(), getAdminDepartments(), getAllFaculty()])
      .then(([{ data: c }, { data: d }, { data: f }]) => { setCourses(c); setDepts(d); setFaculty(f); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createCourse({
        title: form.title, code: form.code, department: form.department,
        faculty: form.faculty || null, credits: Number(form.credits),
        semester: Number(form.semester), year: Number(form.year),
        capacity: Number(form.capacity), academicYear: form.academicYear,
        schedule: { days: form.schedDays.split(',').map(d => d.trim()).filter(Boolean), startTime: form.startTime, endTime: form.endTime, room: form.room },
      });
      toast.success('Course created!');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteCourse(id);
      toast.success('Course deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = filter ? courses.filter(c => c.department?._id === filter) : courses;

  if (loading) return <Layout><div style={s.center}>⏳ Loading...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>📚 Manage Courses</h1>
          <p style={s.sub}>{courses.length} courses in the system</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
          {showForm ? '✕ Cancel' : '+ Add Course'}
        </button>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>New Course</h3>
          <form onSubmit={handleSubmit} style={s.formGrid}>
            <div><label style={s.label}>Title *</label><input style={s.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div><label style={s.label}>Code *</label><input style={s.input} value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required /></div>
            <div>
              <label style={s.label}>Department *</label>
              <select style={s.input} value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                <option value="">Select...</option>
                {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Faculty</label>
              <select style={s.input} value={form.faculty} onChange={e => setForm({...form, faculty: e.target.value})}>
                <option value="">Select...</option>
                {faculty.map(f => <option key={f._id} value={f._id}>{f.user?.name}</option>)}
              </select>
            </div>
            {[['Credits','credits',1,6],['Semester','semester',1,12],['Year','year',1,6],['Capacity','capacity',10,200]].map(([label,field,min,max]) => (
              <div key={field}><label style={s.label}>{label}</label><input style={s.input} type="number" min={min} max={max} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} /></div>
            ))}
            <div><label style={s.label}>Academic Year</label><input style={s.input} value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} /></div>
            <div><label style={s.label}>Days (comma-sep)</label><input style={s.input} placeholder="Mon,Wed,Fri" value={form.schedDays} onChange={e => setForm({...form, schedDays: e.target.value})} /></div>
            <div><label style={s.label}>Start Time</label><input style={s.input} type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} /></div>
            <div><label style={s.label}>End Time</label><input style={s.input} type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} /></div>
            <div><label style={s.label}>Room</label><input style={s.input} placeholder="CS-101" value={form.room} onChange={e => setForm({...form, room: e.target.value})} /></div>
            <div style={{ gridColumn: '1/-1' }}><button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Create Course'}</button></div>
          </form>
        </div>
      )}

      {/* Filter by dept */}
      <div style={s.filterRow}>
        <button onClick={() => setFilter('')} style={{ ...s.filterBtn, ...(filter === '' ? s.filterActive : {}) }}>All ({courses.length})</button>
        {depts.map(d => {
          const count = courses.filter(c => c.department?._id === d._id).length;
          return <button key={d._id} onClick={() => setFilter(d._id)} style={{ ...s.filterBtn, ...(filter === d._id ? s.filterActive : {}) }}>{d.code} ({count})</button>;
        })}
      </div>

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Code','Title','Department','Faculty','Credits','Enrolled','Schedule','Status','Action'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c._id} style={s.tr}>
                <td style={s.td}><span style={s.codeTag}>{c.code}</span></td>
                <td style={s.td}><strong>{c.title}</strong><br/><span style={{ fontSize: '11px', color: '#94a3b8' }}>Year {c.year} · Sem {c.semester}</span></td>
                <td style={s.td}>{c.department?.code}</td>
                <td style={s.td}>{c.faculty?.user?.name || '—'}</td>
                <td style={s.td}>{c.credits}</td>
                <td style={s.td}>
                  <span style={{ fontWeight: '600', color: c.enrolled === c.capacity ? '#dc2626' : '#1e3c72' }}>{c.enrolled}</span>/{c.capacity}
                </td>
                <td style={s.td}><span style={{ fontSize: '11px' }}>{c.schedule?.days?.join(',')}<br/>{c.schedule?.startTime} · {c.schedule?.room}</span></td>
                <td style={s.td}>
                  <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: c.status === 'active' ? '#f0fdf4' : '#f5f5f5', color: c.status === 'active' ? '#16a34a' : '#64748b' }}>
                    {c.status}
                  </span>
                </td>
                <td style={s.td}>
                  <button onClick={() => handleDelete(c._id, c.title)} style={s.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

const s = {
  center:     { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:  { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:        { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  addBtn:     { padding: '10px 20px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  formCard:   { background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' },
  formTitle:  { fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '16px' },
  formGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' },
  label:      { display: 'block', fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:      { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1e3c72' },
  saveBtn:    { padding: '10px 24px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  filterRow:  { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filterBtn:  { padding: '7px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', color: '#64748b' },
  filterActive:{ background: '#1e3c72', color: '#fff', border: '1px solid #1e3c72' },
  card:       { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th:         { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr:         { borderBottom: '1px solid #f1f5f9' },
  td:         { padding: '11px 14px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },
  codeTag:    { fontFamily: 'monospace', fontSize: '12px', background: '#f0f4ff', color: '#1e3c72', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' },
  deleteBtn:  { padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
};

export default ManageCourses;