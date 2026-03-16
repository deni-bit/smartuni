import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getAdminDepartments, createDepartment, updateDepartment } from '../../services/api';

const ManageDepartments = () => {
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [form,    setForm]    = useState({ name: '', code: '', description: '' });
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    getAdminDepartments()
      .then(({ data }) => setDepts(data))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    try {
      setSaving(true);
      await createDepartment({ name: form.name, code: form.code.toUpperCase(), description: form.description });
      toast.success('Department created!');
      setForm({ name: '', code: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  const deptColors = ['#1e3c72','#2a9d8f','#ff7e5f','#6f42c1','#c9a227','#dc3545'];

  if (loading) return <Layout><div style={s.center}>⏳ Loading...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>🏛️ Departments</h1>
          <p style={s.sub}>{depts.length} departments registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
          {showForm ? '✕ Cancel' : '+ Add Department'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>New Department</h3>
          <form onSubmit={handleSubmit} style={s.formGrid}>
            <div>
              <label style={s.label}>Department Name *</label>
              <input style={s.input} placeholder="e.g. Computer Science" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={s.label}>Code *</label>
              <input style={s.input} placeholder="e.g. CS" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required maxLength={6} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.label}>Description</label>
              <input style={s.input} placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Create Department'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Department cards */}
      <div style={s.grid}>
        {depts.map((dept, i) => (
          <div key={dept._id} style={s.card}>
            <div style={{ ...s.cardTop, background: deptColors[i % deptColors.length] }}>
              <span style={s.deptCode}>{dept.code}</span>
              <span style={s.deptStatus}>{dept.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={s.cardBody}>
              <h3 style={s.deptName}>{dept.name}</h3>
              <p style={s.deptDesc}>{dept.description || 'No description'}</p>
              <div style={s.deptMeta}>
                <span style={s.metaItem}>👤 Head: {dept.head?.name || 'Not assigned'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

const s = {
  center:    { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:       { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  addBtn:    { padding: '10px 20px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  formCard:  { background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' },
  formTitle: { fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '16px' },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label:     { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:     { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1e3c72' },
  saveBtn:   { padding: '10px 24px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' },
  card:      { background: '#fff', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  cardTop:   { padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  deptCode:  { fontSize: '20px', fontWeight: '900', color: '#fff', letterSpacing: '1px' },
  deptStatus:{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '10px' },
  cardBody:  { padding: '18px 20px' },
  deptName:  { fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '6px' },
  deptDesc:  { fontSize: '12px', color: '#64748b', lineHeight: '1.6', marginBottom: '12px' },
  deptMeta:  { borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  metaItem:  { fontSize: '12px', color: '#64748b' },
};

export default ManageDepartments;