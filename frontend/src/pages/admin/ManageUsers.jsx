import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getAllUsers, toggleUserStatus } from '../../services/api';

const roleColor = { admin: '#ff7e5f', faculty: '#2a9d8f', student: '#1e3c72', staff: '#6f42c1' };
const roleBg    = { admin: '#fff4f2', faculty: '#f0faf9', student: '#f0f4ff', staff: '#f5f3ff' };

const ManageUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAllUsers()
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id, name) => {
    try {
      await toggleUserStatus(id);
      toast.success(`${name}'s status updated`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = users
    .filter(u => filter === 'all' || u.role === filter)
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const counts = { all: users.length, admin: 0, faculty: 0, student: 0, staff: 0 };
  users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });

  if (loading) return <Layout><div style={s.center}>⏳ Loading users...</div></Layout>;

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.pageTitle}>👥 Manage Users</h1>
        <p style={s.sub}>{users.length} total users in the system</p>
      </div>

      {/* Filter tabs */}
      <div style={s.tabRow}>
        {['all','admin','faculty','student','staff'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} style={{ ...s.tab, ...(filter === tab ? s.tabActive : {}) }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={s.tabCount}>{counts[tab]}</span>
          </button>
        ))}
        <input
          style={s.search}
          placeholder="🔍 Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              {['#','Name','Email','Role','Phone','Last Login','Status','Action'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No users found</td></tr>
            ) : filtered.map((user, i) => (
              <tr key={user._id} style={s.tr}>
                <td style={s.td}>{i + 1}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: roleColor[user.role] || '#1e3c72', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                      {user.name.charAt(0)}
                    </div>
                    <strong>{user.name}</strong>
                  </div>
                </td>
                <td style={s.td}>{user.email}</td>
                <td style={s.td}>
                  <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: roleBg[user.role], color: roleColor[user.role], textTransform: 'uppercase' }}>
                    {user.role}
                  </span>
                </td>
                <td style={s.td}>{user.phone || '—'}</td>
                <td style={s.td}>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td style={s.td}>
                  <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: user.isActive ? '#f0fdf4' : '#fef2f2', color: user.isActive ? '#16a34a' : '#dc2626' }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={s.td}>
                  <button onClick={() => handleToggle(user._id, user.name)} style={{ ...s.toggleBtn, background: user.isActive ? '#fef2f2' : '#f0fdf4', color: user.isActive ? '#dc2626' : '#16a34a' }}>
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
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
  center:    { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' },
  header:    { marginBottom: '24px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', color: '#1e3c72', fontFamily: 'Georgia, serif' },
  sub:       { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  tabRow:    { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  tab:       { padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  tabActive: { background: '#1e3c72', color: '#fff', border: '1px solid #1e3c72' },
  tabCount:  { fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '8px' },
  search:    { marginLeft: 'auto', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', minWidth: '260px' },
  card:      { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th:        { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'nowrap' },
  tr:        { borderBottom: '1px solid #f1f5f9' },
  td:        { padding: '12px 14px', fontSize: '13px', color: '#334155' },
  toggleBtn: { padding: '5px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
};

export default ManageUsers;